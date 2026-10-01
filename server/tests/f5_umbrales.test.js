const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Umbral = require('../src/models/Umbral');
const Auditoria = require('../src/models/Auditoria');

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
  await Auditoria.deleteMany({});
  process.env.NODE_ENV = 'test';
});


describe('Módulo F5: Gestión y Firma de Umbrales (Tareas 2 y 3)', () => {

  // Validación AC-F5-03: Rangos inválidos y rechazo >= aprobación
  test('Tarea 2 [AC-F5-03]: Debe rechazar propuesta si umbral_rechazo >= umbral_aprobacion', async () => {
    const res = await request(app)
      .post('/api/umbrales')
      .send({
        umbral_aprobacion: 60,
        umbral_rechazo: 70, // Invalido: rechazo mayor que aprobacion
        autor_modificacion: 'Max Latuz'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Violacion AC-F5-03');
  });

  // Validación AC-F5-01 y RNF-05: El umbral queda en estado PENDIENTE
  test('Tarea 2 [AC-F5-01 / RNF-05]: Propuesta exitosa queda en estado PENDIENTE y registra en Auditoría', async () => {
    const res = await request(app)
      .post('/api/umbrales')
      .send({
        umbral_aprobacion: 85,
        umbral_rechazo: 50,
        autor_modificacion: 'Max Latuz'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.estado_publicacion).toBe('PENDIENTE');
    expect(res.body.data.version).toBe(1);

    // Verificar registro en Auditoría (RNF-02)
    const logs = await Auditoria.find({ entidad: 'UMBRAL' });
    expect(logs.length).toBe(1);
    expect(logs[0].autor).toBe('Max Latuz');
    expect(logs[0].accion).toBe('PROPUESTA_CREADA');
  });

  // Validación Tarea 3 (Firma) y PX-05: Interrupción sin firma válida y activación con firma
  test('Tarea 3 [PX-05 / CU-03]: Exige firma del Oficial de Cumplimiento para activar el umbral', async () => {
    // 1. Crear propuesta
    const propuesta = await Umbral.create({
      version: 1,
      umbral_aprobacion: 90,
      umbral_rechazo: 60,
      autor_modificacion: 'Max Latuz',
      estado_publicacion: 'PENDIENTE'
    });

    // 2. Intentar firmar sin token o sin autor
    const resFallo = await request(app)
      .patch(`/api/umbrales/${propuesta._id}/firma`)
      .send({});

    expect(resFallo.statusCode).toBe(400);
    expect(resFallo.body.error).toContain('Violacion RNF-05');

    // 3. Firmar correctamente
    const resExito = await request(app)
      .patch(`/api/umbrales/${propuesta._id}/firma`)
      .send({
        oficial_cumplimiento: 'Oficial de Cumplimiento MIRA',
        token_firma: 'SIG-TOKEN-SHA256-VALID'
      });

    expect(resExito.statusCode).toBe(200);
    expect(resExito.body.data.estado_publicacion).toBe('ACTIVO');
    expect(resExito.body.data.firma_cumplimiento.valido).toBe(true);
  });
});
