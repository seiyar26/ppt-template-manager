const express = require('express');
const { sendExportByEmail, getEmailTemplates } = require('../controllers/emailController');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

// Configuration de Multer pour les pièces jointes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'attachments'));
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec timestamp
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB par fichier
  fileFilter: (req, file, cb) => {
    // Autoriser seulement certains types de fichiers
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|jpg|jpeg|png|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé! Seuls les documents, images et archives sont acceptés.'));
    }
  }
});

const router = express.Router();

// Routes pour les emails sécurisées avec middleware d'authentification
router.post('/exports/:id/send', auth, upload.array('attachments', 5), sendExportByEmail);
router.get('/templates', auth, getEmailTemplates);

module.exports = router;
