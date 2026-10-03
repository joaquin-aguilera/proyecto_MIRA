const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Umbral = require('../src/models/Umbral');
const Caso = require('../src/models/Caso');
const Auditoria = require('../src/models/Auditoria');
const casosDidacticos = require('../src/data/casos_didacticos.json');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  process.env.NODE_ENV = 'test_cleanup';
  await Umbral.deleteMany({});
  await Caso.deleteMany({});
  await Auditoria.deleteMany({});
  process.env.NODE_ENV = 'test';
});

describe('Módulo F4: Motor de Evaluación y Decisión Algorítmica (Tarea 4 y Tarea 6)', () => {

  // PF-01: Cálculo correcto de puntaje sobre caso 1 (debe dar APROBADO con 90.5 pts)
  test('PF-01 [RF-01]: Cálculo correcto de puntaje sobre Caso 1 (APROBADO con 90.5 pts)', async () => {
    // 1. Configurar umbral activo con versión 1
    await Umbral.create({
      version: 1,
      flujo_id: 'FLUJO_MIRA_GENERAL',
      umbral_aprobacion: 85,
      umbral_rechazo: 60,
      pesos_senales: { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
      estado_publicacion: 'ACTIVO',
      autor_modificacion: 'Max Latuz'
    });

    // 2. Enviar Caso 1 desde dataset didáctico
    const res = await request(app)
      .post('/api/casos/evaluar')
      .send({
        caso_id: casosDidacticos.caso_01.caso_id,
        datos_evaluacion: casosDidacticos.caso_01.datos_evaluacion
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.puntaje_obtenido).toBe(90.5);
    expect(res.body.data.estado_decision).toBe('APROBADO');
    expect(res.body.data.version_umbral_aplicada).toBe(1);

    // Verificar desglose de señales
    expect(res.body.data.desglose_senales).toHaveLength(3);
    const senalFraude = res.body.data.desglose_senales.find(s => s.nombre === 'fraude');
    expect(senalFraude.aporte_puntaje).toBe(38.0); // 95 * 0.4

    // Verificar persistencia en base de datos (DEC-01)
    const casoPersistido = await Caso.findOne({ caso_id: casosDidacticos.caso_01.caso_id });
    expect(casoPersistido).not.toBeNull();
    expect(casoPersistido.puntaje_obtenido).toBe(90.5);
    expect(casoPersistido.retencion_legal.vigencia_anios).toBe(5);

    // Verificar auditoría inalterable (RNF-02)
    const logsAuditoria = await Auditoria.find({ entidad: 'CASO', entidad_id: casosDidacticos.caso_01.caso_id });
    expect(logsAuditoria.length).toBe(1);
    expect(logsAuditoria[0].accion).toBe('EVALUACION_DECISION_F4');
  });

  // PF-02: Derivación automática ante rango intermedio o mínimo incumplido (Caso 2)
  describe('PF-02 [RF-02]: Derivación automática ante rango intermedio o mínimo incumplido', () => {
    beforeEach(async () => {
      await Umbral.create({
        version: 1,
        flujo_id: 'FLUJO_MIRA_GENERAL',
        umbral_aprobacion: 85,
        umbral_rechazo: 60,
        pesos_senales: { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
        estado_publicacion: 'ACTIVO',
        autor_modificacion: 'Max Latuz'
      });
    });

    test('PF-02 (A): Caso 2 con puntaje intermedio (75 pts entre 60 y 85) debe ser DERIVADO', async () => {
      const res = await request(app)
        .post('/api/casos/evaluar')
        .send({
          caso_id: casosDidacticos.caso_02.caso_id,
          datos_evaluacion: casosDidacticos.caso_02.datos_evaluacion
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.puntaje_obtenido).toBe(75.0);
      expect(res.body.data.estado_decision).toBe('DERIVADO');
      expect(res.body.data.motivo_decision).toContain('rango intermedio');
    });

    test('PF-02 (B): Caso con mínimo propio no superado en señal individual debe ser DERIVADO', async () => {
      const res = await request(app)
        .post('/api/casos/evaluar')
        .send({
          caso_id: casosDidacticos.caso_02_minimo_incumplido.caso_id,
          datos_evaluacion: casosDidacticos.caso_02_minimo_incumplido.datos_evaluacion
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.estado_decision).toBe('DERIVADO');
      expect(res.body.data.motivo_decision).toContain('identidad');
      expect(res.body.data.motivo_decision).toContain('mínimo propio');
    });
  });

  // PF-05: Aislamiento de versión ante actualización de umbrales en caliente
  test('PF-05 [RF-05]: Aislamiento estricto de versión ante actualización de umbrales en caliente', async () => {
    // 1. Caso A ingresa y se procesa bajo la Versión 1 (Aprobación >= 85)
    await Umbral.create({
      version: 1,
      umbral_aprobacion: 85,
      umbral_rechazo: 60,
      pesos_senales: { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
      estado_publicacion: 'ARCHIVADO',
      autor_modificacion: 'Max Latuz'
    });

    // 2. En caliente se publica la Versión 2 con umbral más exigente (Aprobación >= 90)
    await Umbral.create({
      version: 2,
      umbral_aprobacion: 90,
      umbral_rechazo: 60,
      pesos_senales: { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
      estado_publicacion: 'ACTIVO',
      autor_modificacion: 'Oficial de Cumplimiento'
    });

    // Payload de caso con puntaje calculado de 87 puntos:
    // fraude: 90 (36 pts) + ingresos: 85 (25.5 pts) + identidad: 85 (25.5 pts) = 87.0 pts
    const datosCaso = {
      senales: [
        { nombre: 'fraude', valor: 90, minimo_propio: 60 },
        { nombre: 'ingresos', valor: 85, minimo_propio: 60 },
        { nombre: 'identidad', valor: 85, minimo_propio: 60 }
      ],
      senal_fraude_activa: false
    };

    // 3. Evaluar Caso A fijado a Versión 1 (Aislamiento en caliente RF-05)
    const resCasoA = await request(app)
      .post('/api/casos/evaluar')
      .send({
        caso_id: 'CASO-EN-VUELO-V1',
        version_umbral: 1, // Aislamiento explícito de la versión de inicio
        datos_evaluacion: datosCaso
      });

    // Bajo Versión 1 (85 pts), 87 puntos califica como APROBADO
    expect(resCasoA.statusCode).toBe(200);
    expect(resCasoA.body.data.version_umbral_aplicada).toBe(1);
    expect(resCasoA.body.data.puntaje_obtenido).toBe(87.0);
    expect(resCasoA.body.data.estado_decision).toBe('APROBADO');

    // 4. Evaluar caso nuevo que ingresa bajo la Versión 2 activa (sin version fija previa)
    const resCasoNuevo = await request(app)
      .post('/api/casos/evaluar')
      .send({
        caso_id: 'CASO-NUEVO-V2',
        datos_evaluacion: datosCaso
      });

    // Bajo Versión 2 (90 pts), 87 puntos cae en rango intermedio -> DERIVADO
    expect(resCasoNuevo.statusCode).toBe(200);
    expect(resCasoNuevo.body.data.version_umbral_aplicada).toBe(2);
    expect(resCasoNuevo.body.data.puntaje_obtenido).toBe(87.0);
    expect(resCasoNuevo.body.data.estado_decision).toBe('DERIVADO');
  });

  // Precedencia de Fraude (CU-01 / RF-01)
  test('CU-01 / RF-01: Caso 3 con señal de fraude activa debe resultar en RECHAZADO inmediato', async () => {
    await Umbral.create({
      version: 1,
      umbral_aprobacion: 85,
      umbral_rechazo: 60,
      pesos_senales: { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
      estado_publicacion: 'ACTIVO',
      autor_modificacion: 'Max Latuz'
    });

    const res = await request(app)
      .post('/api/casos/evaluar')
      .send({
        caso_id: casosDidacticos.caso_03.caso_id,
        datos_evaluacion: casosDidacticos.caso_03.datos_evaluacion
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.estado_decision).toBe('RECHAZADO');
    expect(res.body.data.motivo_decision).toContain('señal de fraude activa confirmada');
  });
});
