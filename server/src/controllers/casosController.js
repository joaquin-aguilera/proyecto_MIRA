const Caso = require('../models/Caso');
const Umbral = require('../models/Umbral');
const Auditoria = require('../models/Auditoria');

/**
 * Controlador para el Motor de Evaluación y Decisión Algorítmica F4 (SPEC-F4)
 * Implementado por: Joaquín Aguilera (Backend Lead / Arquitecto)
 * Soporta: RF-01 (cálculo de puntaje), RF-02 (derivación y mínimos), RF-05 (aislamiento en caliente), CU-01
 */

// Tarea 4: Evaluar caso y emitir veredicto (POST /api/casos/evaluar)
exports.evaluarCaso = async (req, res) => {
  try {
    const { caso_id, datos_evaluacion, version_umbral, autor } = req.body;

    // Validación básica de entradas
    if (!caso_id) {
      return res.status(400).json({
        success: false,
        error: 'Parametros incompletos. Debe incluir caso_id.'
      });
    }

    if (!datos_evaluacion || !Array.isArray(datos_evaluacion.senales) || datos_evaluacion.senales.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parametros incompletos. datos_evaluacion debe incluir al menos una señal en senales.'
      });
    }

    // Aislamiento en Caliente (RF-05 / PF-05):
    // Si se especifica version_umbral, se consume estrictamente dicha versión histórica.
    // De lo contrario, se consulta el umbral actualmente ACTIVO en la base de datos.
    let umbralAplicado = null;
    if (version_umbral !== undefined && version_umbral !== null) {
      umbralAplicado = await Umbral.findOne({ version: Number(version_umbral) });
    } else {
      umbralAplicado = await Umbral.findOne({ estado_publicacion: 'ACTIVO' }).sort({ version: -1 });
    }

    // Parámetros resueltos con fallback seguro si la BD está inicializándose
    const version_aplicada = umbralAplicado ? umbralAplicado.version : 1;
    const umbral_aprobacion = umbralAplicado ? umbralAplicado.umbral_aprobacion : 85;
    const umbral_rechazo = umbralAplicado ? umbralAplicado.umbral_rechazo : 60;
    const pesos_config = (umbralAplicado && umbralAplicado.pesos_senales)
      ? umbralAplicado.pesos_senales
      : { fraude: 0.4, ingresos: 0.3, identidad: 0.3 };

    // Función auxiliar para extraer peso por señal
    const getPeso = (nombre) => {
      if (pesos_config instanceof Map) return pesos_config.get(nombre) ?? 0;
      return pesos_config[nombre] ?? 0;
    };

    // 1. Cálculo de Puntaje Componente a Componente (RF-01):
    // Score = Sum(Valor_i * Peso_i)
    let puntaje_total = 0;
    const desglose_senales = [];
    const senalesBajoMinimo = [];

    for (const senal of datos_evaluacion.senales) {
      const peso = getPeso(senal.nombre);
      const aporte = Number((senal.valor * peso).toFixed(2));
      puntaje_total += aporte;

      desglose_senales.push({
        nombre: senal.nombre,
        valor_obtenido: senal.valor,
        peso_aplicado: peso,
        aporte_puntaje: aporte
      });

      // Mínimo por Señal: verificar si el valor es inferior al mínimo individual exigido
      const minPropio = senal.minimo_propio !== undefined ? senal.minimo_propio : 0;
      if (senal.valor < minPropio) {
        senalesBajoMinimo.push({
          nombre: senal.nombre,
          valor: senal.valor,
          minimo_propio: minPropio
        });
      }
    }

    puntaje_total = Number(puntaje_total.toFixed(2));

    // 2. Lógica de Decisión Algorítmica y Precedencia de Reglas (CU-01 / RF-01 / RF-02)
    let estado_decision = '';
    let motivo_decision = '';

    // Precedencia de Fraude (CU-01 / RF-01):
    // Si senal_fraude_activa === true -> RECHAZADO inmediato (ignora puntaje total alto).
    if (datos_evaluacion.senal_fraude_activa === true) {
      estado_decision = 'RECHAZADO';
      motivo_decision = 'Rechazo inmediato por precedencia de señal de fraude activa confirmada (CU-01 / RF-01)';
    }
    // Mínimo por Señal (RF-02 / CU-01):
    // Si alguna señal tiene Valor_i < Mínimo Propio_i -> DERIVADO inmediato a revisión manual.
    else if (senalesBajoMinimo.length > 0) {
      estado_decision = 'DERIVADO';
      motivo_decision = `Derivación automática a revisión manual: señal '${senalesBajoMinimo[0].nombre}' con valor ${senalesBajoMinimo[0].valor} no supera el mínimo propio exigido de ${senalesBajoMinimo[0].minimo_propio} (RF-02 / CU-01)`;
    }
    // Veredicto por Umbrales:
    // Puntaje >= Umbral Aprobación -> APROBADO
    else if (puntaje_total >= umbral_aprobacion) {
      estado_decision = 'APROBADO';
      motivo_decision = `Aprobado automáticamente: puntaje obtenido (${puntaje_total}) supera o iguala el umbral de aprobación (${umbral_aprobacion}) (RF-01)`;
    }
    // Puntaje <= Umbral Rechazo -> RECHAZADO
    else if (puntaje_total <= umbral_rechazo) {
      estado_decision = 'RECHAZADO';
      motivo_decision = `Rechazado automáticamente: puntaje obtenido (${puntaje_total}) es inferior o igual al umbral de rechazo (${umbral_rechazo}) (RF-01)`;
    }
    // En el rango intermedio -> DERIVADO
    else {
      estado_decision = 'DERIVADO';
      motivo_decision = `Derivado a revisión manual: puntaje obtenido (${puntaje_total}) se ubica en rango intermedio entre ${umbral_rechazo} y ${umbral_aprobacion} (RF-02)`;
    }

    // 3. Persistencia en la Base de Datos (Mongoose / MongoDB)
    let casoGuardado = await Caso.findOne({ caso_id });
    if (casoGuardado) {
      casoGuardado.datos_evaluacion = datos_evaluacion;
      casoGuardado.version_umbral_aplicada = version_aplicada;
      casoGuardado.puntaje_obtenido = puntaje_total;
      casoGuardado.estado_decision = estado_decision;
      casoGuardado.motivo_decision = motivo_decision;
      casoGuardado.desglose_senales = desglose_senales;
      await casoGuardado.save();
    } else {
      casoGuardado = await Caso.create({
        caso_id,
        datos_evaluacion,
        version_umbral_aplicada: version_aplicada,
        puntaje_obtenido: puntaje_total,
        estado_decision,
        motivo_decision,
        desglose_senales
      });
    }

    // 4. Registro inalterable en Auditoría (RNF-02, DEC-01)
    await Auditoria.create({
      entidad: 'CASO',
      entidad_id: caso_id,
      accion: 'EVALUACION_DECISION_F4',
      autor: autor || 'MOTOR_F4_AUTOMATIZADO',
      detalles: {
        version_umbral_aplicada: version_aplicada,
        puntaje_obtenido: puntaje_total,
        estado_decision,
        motivo_decision,
        senal_fraude_activa: Boolean(datos_evaluacion.senal_fraude_activa)
      }
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Caso evaluado exitosamente por Motor Algorítmico F4',
      data: casoGuardado
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Consultar todos los casos evaluados
exports.getCasos = async (req, res) => {
  try {
    const casos = await Caso.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: casos.length,
      data: casos
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Consultar caso específico por su identificador único
exports.getCasoById = async (req, res) => {
  try {
    const caso = await Caso.findOne({ caso_id: req.params.id });
    if (!caso) {
      return res.status(404).json({ success: false, error: 'Caso no encontrado.' });
    }
    return res.status(200).json({ success: true, data: caso });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
