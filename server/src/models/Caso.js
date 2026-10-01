const mongoose = require('mongoose');

/**
 * Esquema de Casos de Evaluación (F4 - SPEC-F4)
 * Soporta: RF-01, RF-02, RF-05, CU-01
 */
const CasoSchema = new mongoose.Schema({
  caso_id: {
    type: String,
    required: true,
    unique: true
  },
  datos_evaluacion: {
    senales: [{
      nombre: { type: String, required: true },
      valor: { type: Number, required: true },
      minimo_propio: { type: Number, default: 0 }
    }],
    senal_fraude_activa: {
      type: Boolean,
      default: false
    }
  },
  // Campo clave para aislamiento en caliente (RF-05 / PF-05)
  version_umbral_aplicada: {
    type: Number,
    required: true
  },
  puntaje_obtenido: {
    type: Number,
    required: true
  },
  estado_decision: {
    type: String,
    enum: ['APROBADO', 'RECHAZADO', 'DERIVADO'],
    required: true
  },
  motivo_decision: {
    type: String,
    required: true
  },
  desglose_senales: [{
    nombre: String,
    valor_obtenido: Number,
    peso_aplicado: Number,
    aporte_puntaje: Number
  }],
  fecha_inicio_proceso: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Caso', CasoSchema);
