const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('nodemailer-express-handlebars');
const { Export, Template } = require('../models');
require('dotenv').config();

/**
 * Envoyer un export par email
 * @route POST /api/exports/:id/send-email
 */
const sendExportByEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { to, cc, subject, message, useTemplate, templateId } = req.body;
    
    // Vérifier si l'export existe
    const exportData = await Export.findByPk(id, {
      include: [{ model: Template, as: 'template' }]
    });
    
    if (!exportData) {
      return res.status(404).json({ message: 'Export non trouvé' });
    }
    
    // Configuration SMTP
    const smtp = {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    };
    
    console.log('Configuration SMTP:', {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      user: smtp.auth.user
    });
    
    // Créer le transporteur
    const transporter = nodemailer.createTransport(smtp);
    
    // Configurer les options de l'email
    let mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: to,
      subject: subject,
      text: message
    };
    
    // Ajouter des destinataires en CC si spécifiés
    if (cc && cc.length > 0) {
      mailOptions.cc = cc;
    }
    
    // Ajouter l'export comme pièce jointe
    const exportFilePath = path.join(__dirname, '..', exportData.file_path);
    if (fs.existsSync(exportFilePath)) {
      mailOptions.attachments = [{
        filename: exportData.file_name,
        path: exportFilePath
      }];
    } else {
      console.error(`Fichier d'export introuvable: ${exportFilePath}`);
      return res.status(404).json({ message: 'Fichier d\'export introuvable' });
    }
    
    // Ajouter des pièces jointes supplémentaires si envoyées avec la requête
    if (req.files && req.files.length > 0) {
      if (!mailOptions.attachments) mailOptions.attachments = [];
      
      req.files.forEach(file => {
        mailOptions.attachments.push({
          filename: file.originalname,
          path: file.path
        });
      });
    }
    
    // Utiliser un template Handlebars si spécifié
    if (useTemplate && req.body.templatePath) {
      // Configurer le moteur de template
      transporter.use('compile', handlebars({
        viewEngine: {
          defaultLayout: false,
          extname: '.hbs'
        },
        viewPath: path.join(__dirname, '..', 'templates', 'email'),
        extName: '.hbs'
      }));
      
      // Remplacer le texte par le template
      mailOptions.template = path.basename(req.body.templatePath, '.hbs');
      mailOptions.context = {
        message: message,
        exportName: exportData.file_name,
        exportDate: new Date(exportData.created_at).toLocaleDateString('fr-FR'),
        templateName: exportData.template ? exportData.template.name : 'Non défini',
        // Ajouter d'autres variables contextuelles selon besoin
      };
    }
    
    // Envoyer l'email
    console.log('Envoi de l\'email:', mailOptions);
    await transporter.sendMail(mailOptions);
    
    // Mettre à jour le nombre d'envois d'emails pour cet export
    exportData.email_count = (exportData.email_count || 0) + 1;
    await exportData.save();
    
    res.status(200).json({ 
      message: 'Email envoyé avec succès',
      emailCount: exportData.email_count
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
};

/**
 * Récupérer les templates d'email disponibles
 * @route GET /api/email/templates
 */
const getEmailTemplates = async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '..', 'templates', 'email');
    
    // Vérifier si le répertoire existe
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      return res.status(200).json({ templates: [] });
    }
    
    // Lire les fichiers de template
    const files = fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.hbs'))
      .map(file => ({
        id: path.basename(file, '.hbs'),
        name: path.basename(file, '.hbs').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        path: file
      }));
    
    res.status(200).json({ templates: files });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des templates d\'email:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des templates d\'email',
      error: error.message
    });
  }
};

module.exports = {
  sendExportByEmail,
  getEmailTemplates
};
