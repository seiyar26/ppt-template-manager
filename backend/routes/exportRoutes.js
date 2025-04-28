const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const exportController = require('../controllers/exportController');

// Routes protégées - accessibles uniquement aux utilisateurs authentifiés
router.use(protect);

// Routes pour la gestion des exports
router.get('/', exportController.getExports);
router.get('/:id', exportController.getExportById);
router.post('/', exportController.createExport);
router.get('/:id/download', exportController.downloadExport);
router.put('/:id/download-count', exportController.updateDownloadCount);
router.delete('/:id', exportController.deleteExport);
router.post('/:id/email', exportController.sendExportByEmail);

module.exports = router;