const mongoose = require('mongoose');

/**
 * Esquema de Umbrales de Decisión (F5 - SPEC-F5)
 * Soporta: RF-05, RNF-02, RNF-05, CU-03
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Umbral', UmbralSchema);
