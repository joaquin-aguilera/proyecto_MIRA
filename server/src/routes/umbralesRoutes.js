const express = require('express');
const router = express.Router();
const umbralesController = require('../controllers/umbralesController');
const Umbral = require('../models/Umbral');

// Rutas Módulo F5 (SPEC-F5)
router.get('/', umbralesController.getUmbrales);
router.get('/activo', async (req, res) => {
  try {
    const activo = await Umbral.findOne({ estado_publicacion: 'ACTIVO' }).sort({ version: -1 });
    res.json({ success: true, data: activo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get('/pendientes', async (req, res) => {
  try {
    const pendientes = await Umbral.find({ estado_publicacion: 'PENDIENTE' }).sort({ createdAt: -1 });
    res.json({ success: true, data: pendientes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get('/historial', async (req, res) => {
  try {
    const historial = await Umbral.find({ estado_publicacion: { $in: ['ARCHIVADO', 'RECHAZADO'] } }).sort({ updatedAt: -1 });
    res.json({ success: true, data: historial });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post('/', umbralesController.proponerUmbral);                // Tarea 2 (POST)
router.patch('/:id/firma', umbralesController.firmarYPublicarUmbral); // Tarea 3 (PATCH Firma)
router.patch('/:id/rechazar', umbralesController.rechazarPropuestaUmbral); // Tarea 3 (PATCH Rechazo)

module.exports = router;

