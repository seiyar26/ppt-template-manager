const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const hbs = require('nodemailer-express-handlebars');

// Configuration par défaut pour le serveur SMTP
let transporterConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// On initialise le transporteur seulement si les variables d'environnement sont définies
const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

// Création du transporteur Nodemailer
const transporter = isSmtpConfigured 
  ? nodemailer.createTransport(transporterConfig)
  : null;

// Configuration des templates Handlebars
if (transporter) {
  const templatesDir = path.join(__dirname, '../templates/emails');
  
  // S'assurer que le répertoire des templates existe
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  transporter.use('compile', hbs({
    viewEngine: {
      extname: '.hbs',
      layoutsDir: templatesDir,
      defaultLayout: false
    },
    viewPath: templatesDir,
    extName: '.hbs'
  }));
}

/**
 * Service d'envoi d'emails
 */
const emailService = {
  /**
   * Envoi d'un email
   * @param {Object} options - Options de l'email
   * @param {string} options.to - Destinataire(s) de l'email
   * @param {string} options.subject - Objet de l'email
   * @param {string} options.template - Nom du template à utiliser
   * @param {Object} options.context - Données à injecter dans le template
   * @param {Array} options.attachments - Pièces jointes (optional)
   * @returns {Promise} - Promesse résolue si l'email est envoyé, rejetée sinon
   */
  sendEmail: async (options) => {
    if (!transporter) {
      console.warn('Service email non configuré. Vérifiez les variables d\'environnement SMTP_*');
      return { success: false, message: 'Service email non configuré' };
    }
    
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@ppt-template-manager.com',
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context || {},
        attachments: options.attachments || []
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email envoyé: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Envoi d'un email avec une présentation en pièce jointe
   * @param {Object} options - Options de l'email
   * @param {string} options.to - Destinataire(s) de l'email
   * @param {string} options.subject - Objet de l'email (optionnel)
   * @param {string} options.message - Message personnalisé (optionnel)
   * @param {string} options.filePath - Chemin du fichier à joindre
   * @param {string} options.fileName - Nom du fichier à joindre
   * @param {Object} options.template - Données du template
   * @returns {Promise} - Promesse résolue si l'email est envoyé, rejetée sinon
   */
  sendPresentationEmail: async (options) => {
    if (!fs.existsSync(path.join(__dirname, '..', options.filePath))) {
      return { success: false, message: 'Fichier non trouvé' };
    }
    
    const attachments = [{
      filename: options.fileName,
      path: path.join(__dirname, '..', options.filePath)
    }];
    
    return emailService.sendEmail({
      to: options.to,
      subject: options.subject || 'Votre présentation PowerPoint',
      template: 'presentation-email',
      context: {
        message: options.message || 'Veuillez trouver ci-joint votre présentation.',
        templateName: options.template?.name || 'Présentation',
        userName: options.userName || 'Utilisateur'
      },
      attachments
    });
  },
  
  /**
   * Vérifie si le service d'email est configuré
   * @returns {boolean} - true si le service est configuré, false sinon
   */
  isConfigured: () => {
    return isSmtpConfigured && transporter !== null;
  }
};

module.exports = emailService;