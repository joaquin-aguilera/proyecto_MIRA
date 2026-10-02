const Umbral = require('../models/Umbral');
const Auditoria = require('../models/Auditoria');

/**
 * Controlador para la Gestión de Umbrales y Reglas (F5 - SPEC-F5)
 * Implementado por: Max Latuz (Representante del Cliente / Módulo F5)
 * Soporta: SPEC-F5, AC-F5-01, AC-F5-02, AC-F5-03, RNF-02, RNF-05, CU-03
 */

// Obtener el umbral activo actual y el historial
exports.getUmbrales = async (req, res) => {
  try {
    const activo = await Umbral.findOne({ estado_publicacion: 'ACTIVO' }).sort({ version: -1 });
    const pendientes = await Umbral.find({ estado_publicacion: 'PENDIENTE' }).sort({ createdAt: -1 });
    const historial = await Umbral.find({ estado_publicacion: 'ARCHIVADO' }).sort({ version: -1 });

    return res.status(200).json({
      success: true,
      activo: activo || null,
      pendientes,
      historial
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Tarea 2: Proponer modificación de umbrales (POST /api/umbrales)
// Soporta: AC-F5-01, AC-F5-02, AC-F5-03, RNF-02
exports.proponerUmbral = async (req, res) => {
  try {
    const { umbral_aprobacion, umbral_rechazo, pesos_senales, autor_modificacion, flujo_id } = req.body;

    // Validación AC-F5-03: Rangos y rechazo < aprobacion
    if (umbral_aprobacion === undefined || umbral_rechazo === undefined || !autor_modificacion) {
      return res.status(400).json({
        success: false,
        error: 'Parametros incompletos. Debe incluir umbral_aprobacion, umbral_rechazo y autor_modificacion.'
      });
    }

    if (umbral_aprobacion < 0 || umbral_aprobacion > 100 || umbral_rechazo < 0 || umbral_rechazo > 100) {
      return res.status(400).json({
        success: false,
        error: 'Violacion AC-F5-03: Los valores de umbral deben estar estrictamente entre 0 y 100.'
      });
    }

    if (Number(umbral_rechazo) >= Number(umbral_aprobacion)) {
      return res.status(400).json({
        success: false,
        error: 'Violacion AC-F5-03: El umbral de rechazo no puede ser mayor o igual al de aprobacion.'
      });
    }

    // Obtener configuración activa previa para registrar valor histórico (AC-F5-02)
    const umbralActivoPrevio = await Umbral.findOne({ estado_publicacion: 'ACTIVO' }).sort({ version: -1 });
    const valorHistorico = umbralActivoPrevio ? {
      version: umbralActivoPrevio.version,
      umbral_aprobacion: umbralActivoPrevio.umbral_aprobacion,
      umbral_rechazo: umbralActivoPrevio.umbral_rechazo,
      pesos_senales: umbralActivoPrevio.pesos_senales
    } : null;

    const nuevaVersion = umbralActivoPrevio ? umbralActivoPrevio.version + 1 : 1;

    // Crear propuesta en estado PENDIENTE (RNF-05 / AC-F5-01)
    const nuevoUmbral = new Umbral({
      version: nuevaVersion,
      flujo_id: flujo_id || 'FLUJO_MIRA_GENERAL',
      umbral_aprobacion,
      umbral_rechazo,
      pesos_senales: pesos_senales || { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
      autor_modificacion,
      estado_publicacion: 'PENDIENTE',
      valor_historico_anterior: valorHistorico
    });

    await nuevoUmbral.save();

    // Registrar en Auditoría inalterable (RNF-02)
    await Auditoria.create({
      entidad: 'UMBRAL',
      entidad_id: nuevoUmbral._id.toString(),
      accion: 'PROPUESTA_CREADA',
      autor: autor_modificacion,
      detalles: {
        version_propuesta: nuevaVersion,
        valores_propuestos: { umbral_aprobacion, umbral_rechazo },
        valor_historico_anterior: valorHistorico
      }
    });

    return res.status(201).json({
      success: true,
      mensaje: 'Propuesta de umbral registrada exitosamente. Pendiente de firma de Cumplimiento (RNF-05).',
      data: nuevoUmbral
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Tarea 3: Firma Electrónica y Publicación (PATCH /api/umbrales/:id/firma)
// Soporta: RNF-05, CU-03, PX-05
exports.firmarYPublicarUmbral = async (req, res) => {
  try {
    const { id } = req.params;
    const { oficial_cumplimiento, token_firma } = req.body;

    if (!oficial_cumplimiento || !token_firma) {
      return res.status(400).json({
        success: false,
        error: 'Violacion RNF-05: Se requiere la identificacion y token de firma valida del Oficial de Cumplimiento.'
      });
    }

    const propuesta = await Umbral.findById(id);
    if (!propuesta) {
      return res.status(404).json({ success: false, error: 'Propuesta de umbral no encontrada.' });
    }

    if (propuesta.estado_publicacion !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        error: `La propuesta ya se encuentra en estado ${propuesta.estado_publicacion}.`
      });
    }

    // 1. Archivar el umbral activo anterior si existe
    await Umbral.updateMany(
      { estado_publicacion: 'ACTIVO' },
      { $set: { estado_publicacion: 'ARCHIVADO' } }
    );

    // 2. Activar el nuevo umbral con la firma estampada
    propuesta.estado_publicacion = 'ACTIVO';
    propuesta.firma_cumplimiento = {
      firmado_por: oficial_cumplimiento,
      fecha_firma: new Date(),
      token_firma,
      valido: true
    };

    await propuesta.save();

    // 3. Registrar en Auditoría inalterable (RNF-02)
    await Auditoria.create({
      entidad: 'UMBRAL',
      entidad_id: propuesta._id.toString(),
      accion: 'FIRMA_Y_DESPLIEGUE_ACTIVO',
      autor: oficial_cumplimiento,
      detalles: {
        version_activada: propuesta.version,
        token_firma,
        fecha_activacion: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      mensaje: `Umbral Version ${propuesta.version} firmado y desplegado activamente en produccion (CU-03).`,
      data: propuesta
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Tarea 3 (Flujo 5a): Desaprobar / Rechazar Propuesta de Umbral (PATCH /api/umbrales/:id/rechazar)
// Soporta: CU-03 Flujo 5a, RNF-02, RNF-05
exports.rechazarPropuestaUmbral = async (req, res) => {
  try {
    const { id } = req.params;
    const { oficial_cumplimiento, motivo_rechazo } = req.body;

    if (!oficial_cumplimiento || !motivo_rechazo) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar la identificacion del Oficial de Cumplimiento y el motivo del rechazo.'
      });
    }

    const propuesta = await Umbral.findById(id);
    if (!propuesta) {
      return res.status(404).json({ success: false, error: 'Propuesta de umbral no encontrada.' });
    }

    if (propuesta.estado_publicacion !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        error: `La propuesta ya se encuentra en estado ${propuesta.estado_publicacion}.`
      });
    }

    propuesta.estado_publicacion = 'RECHAZADO';
    propuesta.motivo_rechazo = motivo_rechazo;
    await propuesta.save();

    // Registrar en Auditoría inalterable (RNF-02)
    await Auditoria.create({
      entidad: 'UMBRAL',
      entidad_id: propuesta._id.toString(),
      accion: 'PROPUESTA_RECHAZADA_POR_CUMPLIMIENTO',
      autor: oficial_cumplimiento,
      detalles: {
        version_rechazada: propuesta.version,
        motivo: motivo_rechazo,
        fecha: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      mensaje: `Propuesta de umbral Version ${propuesta.version} rechazada exitosamente. Produccion permanece intacta.`,
      data: propuesta
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

