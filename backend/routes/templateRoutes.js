const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addField,
  updateField,
  deleteField,
  generateTemplateDocument,
  addTemplateToCategory,
  removeTemplateFromCategory
} = require('../controllers/templateController');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only PPTX files
    if (path.extname(file.originalname).toLowerCase() === '.pptx') {
      return cb(null, true);
    }
    cb(new Error('Only PPTX files are allowed'));
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply auth middleware to all routes
router.use(auth);

// Get all templates
router.get('/', getTemplates);

// Get a template by ID
router.get('/:id', getTemplateById);

// Create a new template
router.post('/', upload.single('file'), createTemplate);

// Update a template
router.put('/:id', updateTemplate);

// Delete a template
router.delete('/:id', deleteTemplate);

// Field routes
router.post('/:id/fields', addField);
router.put('/:id/fields/:fieldId', updateField);
router.delete('/:id/fields/:fieldId', deleteField);

// Generate document
router.post('/:id/generate', generateTemplateDocument);

// Routes pour l'association des templates aux catégories
router.post('/:id/categories', addTemplateToCategory);
router.delete('/:id/categories/:categoryId', removeTemplateFromCategory);

module.exports = router;