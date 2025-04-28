const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const categoryController = require('../controllers/categoryController');

// Routes protégées - accessibles uniquement aux utilisateurs authentifiés
router.use(protect);

// Routes pour les catégories
router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/reorder', categoryController.reorderCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Routes pour la relation template-catégorie
router.post('/:id/templates/:templateId', categoryController.addTemplateToCategory);
router.delete('/:id/templates/:templateId', categoryController.removeTemplateFromCategory);

module.exports = router;