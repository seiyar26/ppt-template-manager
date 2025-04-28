const fs = require('fs');
const path = require('path');
const { Export, Template, User } = require('../models');
const storageService = require('../utils/storageService');
const emailService = require('../utils/emailService');

/**
 * Récupérer l'historique des exportations pour l'utilisateur
 * @route GET /api/exports
 */
const getExports = async (req, res) => {
  try {
    const { format, templateId, startDate, endDate, sort = 'desc', limit = 50, offset = 0 } = req.query;
    
    // Construire les conditions de filtre
    const where = { user_id: req.user.id };
    
    if (format) {
      where.format = format;
    }
    
    if (templateId) {
      where.template_id = templateId;
    }
    
    // Filtrage par date
    if (startDate || endDate) {
      where.export_date = {};
      const { Op } = require('sequelize');
      
      if (startDate) {
        where.export_date[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        where.export_date[Op.lte] = new Date(endDate);
      }
    }
    
    // Récupérer les exports avec pagination
    const exports = await Export.findAndCountAll({
      where,
      order: [['export_date', sort.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Template,
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json({
      exports: exports.rows,
      total: exports.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des exports:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Récupérer un export par son ID
 * @route GET /api/exports/:id
 */
const getExportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exportData = await Export.findOne({
      where: { id, user_id: req.user.id },
      include: [
        {
          model: Template,
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!exportData) {
      return res.status(404).json({ message: 'Export non trouvé' });
    }
    
    res.json({ export: exportData });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'export:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour le compteur de téléchargement d'un export
 * @route PUT /api/exports/:id/download
 */
const updateDownloadCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exportData = await Export.findOne({
      where: { id, user_id: req.user.id }
    });
    
    if (!exportData) {
      return res.status(404).json({ message: 'Export non trouvé' });
    }
    
    // Incrémenter le compteur de téléchargement
    exportData.download_count += 1;
    await exportData.save();
    
    res.json({ message: 'Compteur de téléchargement mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compteur de téléchargement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Enregistrer un nouvel export
 * @route POST /api/exports
 */
const createExport = async (req, res) => {
  try {
    const { templateId, documentName, format, filePath } = req.body;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier d\'export introuvable' });
    }
    
    // Upload du fichier vers Supabase Storage
    const destPath = `exports/${req.user.id}/${path.basename(filePath)}`;
    const uploadResult = await storageService.uploadFile(filePath, destPath);
    
    let fileUrl = '';
    if (uploadResult.success) {
      fileUrl = uploadResult.url;
    } else {
      console.error('Erreur lors du téléchargement vers Supabase:', uploadResult.error);
    }
    
    // Créer l'entrée d'export dans la base de données
    const exportRecord = await Export.create({
      user_id: req.user.id,
      template_id: templateId,
      document_name: documentName,
      format: format,
      file_path: uploadResult.success ? destPath : filePath,
      file_url: fileUrl,
      file_size: fs.statSync(filePath).size
    });
    
    res.status(201).json({
      message: 'Export créé avec succès',
      export: exportRecord
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'export:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Télécharger un export
 * @route GET /api/exports/:id/download
 */
const downloadExport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'export
    const exportRecord = await Export.findOne({
      where: { id, user_id: req.user.id }
    });
    
    if (!exportRecord) {
      return res.status(404).json({ message: 'Export non trouvé' });
    }
    
    const filePath = exportRecord.file_path;
    
    // Vérifier si le fichier est dans Supabase ou en local
    if (filePath.startsWith('exports/')) {
      // Le fichier est dans Supabase
      if (exportRecord.file_url) {
        // Rediriger vers l'URL publique
        return res.redirect(exportRecord.file_url);
      } else {
        // Télécharger depuis Supabase vers un fichier temporaire, puis servir
        const tempFilePath = path.join(__dirname, '../temp', path.basename(filePath));
        
        // Créer le répertoire temporaire s'il n'existe pas
        if (!fs.existsSync(path.dirname(tempFilePath))) {
          fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
        }
        
        const downloadResult = await storageService.downloadFile(filePath, tempFilePath);
        
        if (!downloadResult.success) {
          return res.status(500).json({ message: 'Erreur lors du téléchargement depuis Supabase' });
        }
        
        // Servir le fichier temporaire
        res.download(tempFilePath, exportRecord.document_name + '.' + exportRecord.format, (err) => {
          // Supprimer le fichier temporaire après le téléchargement
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          
          if (err) {
            console.error('Erreur lors de l\'envoi du fichier:', err);
          }
        });
      }
    } else {
      // Le fichier est sur le disque local
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichier non trouvé' });
      }
      
      // Servir le fichier
      res.download(filePath, exportRecord.document_name + '.' + exportRecord.format);
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'export:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Supprimer un export
 * @route DELETE /api/exports/:id
 */
const deleteExport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'export
    const exportRecord = await Export.findOne({
      where: { id, user_id: req.user.id }
    });
    
    if (!exportRecord) {
      return res.status(404).json({ message: 'Export non trouvé' });
    }
    
    const filePath = exportRecord.file_path;
    
    // Supprimer le fichier de Supabase ou du disque local
    if (filePath.startsWith('exports/')) {
      // Supprimer de Supabase
      await storageService.deleteFile(filePath);
    } else if (fs.existsSync(filePath)) {
      // Supprimer du disque local
      fs.unlinkSync(filePath);
    }
    
    // Supprimer l'enregistrement de la base de données
    await exportRecord.destroy();
    
    res.json({ message: 'Export supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'export:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * Envoyer un export par email
 * @route POST /api/exports/:id/send
 */
const sendExportByEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipients, subject, message } = req.body;
    
    // Vérifier si le service d'email est configuré
    if (!emailService.isConfigured()) {
      return res.status(400).json({ message: 'Le service d\'email n\'est pas configuré' });
    }
    
    // Vérifier si la liste de destinataires est fournie
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Aucun destinataire spécifié' });
    }
    
    // Récupérer les données de l'export
    const exportData = await Export.findOne({
      where: { id, user_id: req.user.id },
      include: [
        {
          model: Template,
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!exportData) {
      return res.status(404).json({ message: 'Export non trouvé' });
    }
    
    // Vérifier si le fichier existe
    const filePath = path.join(__dirname, '..', exportData.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Envoyer l'email à chaque destinataire
    const emailPromises = recipients.map(recipient => {
      return emailService.sendPresentationEmail({
        to: recipient,
        subject: subject || `Présentation ${exportData.Template.name}`,
        message: message || '',
        filePath: exportData.file_path,
        fileName: exportData.file_name,
        template: exportData.Template,
        userName: req.user.name
      });
    });
    
    const results = await Promise.all(emailPromises);
    
    // Vérifier les résultats
    const allSuccess = results.every(result => result.success);
    
    if (allSuccess) {
      // Mettre à jour la liste des destinataires dans l'export
      exportData.recipients = [...(exportData.recipients || []), ...recipients];
      await exportData.save();
      
      res.json({ message: 'Email(s) envoyé(s) avec succès' });
    } else {
      const errors = results.filter(result => !result.success);
      res.status(500).json({ 
        message: 'Certains emails n\'ont pas pu être envoyés',
        errors 
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getExports,
  getExportById,
  updateDownloadCount,
  createExport,
  downloadExport,
  deleteExport,
  sendExportByEmail
};