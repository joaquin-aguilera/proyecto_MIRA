const express = require('express');
const router = express.Router();
const casosController = require('../controllers/casosController');

/**
 * Rutas del Motor de Evaluación F4 (SPEC-F4)
 * Soporta: RF-01, RF-02, RF-05, CU-01
 */

// Tarea 4: Endpoint asincrónico para evaluar caso y registrar decisión
router.post('/evaluar', casosController.evaluarCaso);

// Consultas operativas de casos
router.get('/', casosController.getCasos);
router.get('/:id', casosController.getCasoById);

module.exports = router;
