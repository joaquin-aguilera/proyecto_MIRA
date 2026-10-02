const mongoose = require('mongoose');

/**
 * Esquema de Umbrales de Decisión (F5 - SPEC-F5)
 * Soporta: RF-05 (versionado incremental), RNF-02 (auditoría), RNF-05 (firma), CU-03, DEC-01 (retención legal)
 */
const UmbralSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true,
    default: 1
  },
  flujo_id: {
    type: String,
    required: true,
    default: 'FLUJO_MIRA_GENERAL'
  },
  umbral_aprobacion: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  umbral_rechazo: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  pesos_senales: {
    fraude: { type: Number, default: 0.4 },
    ingresos: { type: Number, default: 0.3 },
    identidad: { type: Number, default: 0.3 }
  },
  estado_publicacion: {
    type: String,
    enum: ['PENDIENTE', 'ACTIVO', 'ARCHIVADO'],
    default: 'PENDIENTE'
  },
  autor_modificacion: {
    type: String,
    required: true
  },
  valor_historico_anterior: {
    type: Object,
    default: null
  },
  firma_cumplimiento: {
    firmado_por: { type: String, default: null },
    fecha_firma: { type: Date, default: null },
    token_firma: { type: String, default: null },
    valido: { type: Boolean, default: false }
  },
  fecha_solicitud: {
    type: Date,
    default: Date.now
  },
  // Soporte DEC-01: Política de custodia documental y retención inalterable por 5 años
  retencion_legal: {
    vigencia_anios: { type: Number, default: 5, immutable: true },
    fecha_expiracion_custodia: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      immutable: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Umbral', UmbralSchema);
