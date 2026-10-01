const express = require('express');
const router = express.Router();
const umbralesController = require('../controllers/umbralesController');

// Rutas Módulo F5 (SPEC-F5)
router.get('/', umbralesController.getUmbrales);
router.post('/', umbralesController.proponerUmbral);                // Tarea 2 (POST)
router.patch('/:id/firma', umbralesController.firmarYPublicarUmbral); // Tarea 3 (PATCH Firma)

module.exports = router;
