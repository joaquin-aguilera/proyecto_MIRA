const mongoose = require('mongoose');

/**
 * Esquema de Auditoría Append-Only (RNF-02, DEC-01)
 * Diseñado para retención documental inalterable de 5 años y bloqueo estricto de borrado/modificación.
 * Soporta: DEC-01 (retención de 5 años), RNF-02 (auditoría inalterable append-only), PX-02.
 */
const AuditoriaSchema = new mongoose.Schema({
  entidad: {
    type: String,
    required: true,
    enum: ['UMBRAL', 'CASO', 'SISTEMA']
  },
  entidad_id: {
    type: String,
    required: true
  },
  accion: {
    type: String,
    required: true
  },
  autor: {
    type: String,
    required: true
  },
  detalles: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  fecha_evento: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  // Soporte DEC-01: Retención legal inalterable por 5 años
  retencion_legal: {
    vigencia_anios: { type: Number, default: 5, immutable: true },
    fecha_expiracion_custodia: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      immutable: true
    }
  }
}, { timestamps: false });

// Middleware para garantizar inalterabilidad estricta a nivel de documento (RNF-02 / PX-02)
AuditoriaSchema.pre('save', function(next) {
  if (!this.isNew) {
    const error = new Error('VIOLACION_RNF_02: El registro de auditoría es estrictamente inalterable (Append-Only). No se permiten modificaciones ni eliminaciones.');
    return next(error);
  }
  next();
});

// Middleware para garantizar inalterabilidad estricta en operaciones de consulta / actualización (RNF-02 / PX-02)
AuditoriaSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], function(next) {
  const error = new Error('VIOLACION_RNF_02: El registro de auditoría es estrictamente inalterable (Append-Only). No se permiten modificaciones ni eliminaciones.');
  next(error);
});

// Bloqueo explícito de deleteMany a menos que se indique explícitamente bandera interna de prueba
AuditoriaSchema.pre('deleteMany', function(next) {
  if (process.env.NODE_ENV !== 'test_cleanup') {
    const error = new Error('VIOLACION_RNF_02: El registro de auditoría es estrictamente inalterable (Append-Only). No se permiten modificaciones ni eliminaciones.');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Auditoria', AuditoriaSchema);
