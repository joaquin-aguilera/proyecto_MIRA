const mongoose = require('mongoose');

/**
 * Esquema de Casos de Evaluación (F4 - SPEC-F4)
 * Soporta: RF-01, RF-02, RF-05, CU-01, DEC-01 (retención legal de expedientes por 5 años)
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
    required: true,
    immutable: true
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
    default: Date.now,
    immutable: true
  },
  // Soporte DEC-01: Política de custodia inalterable de expedientes por 5 años
  retencion_legal: {
    vigencia_anios: { type: Number, default: 5, immutable: true },
    fecha_expiracion_custodia: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      immutable: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Caso', CasoSchema);
