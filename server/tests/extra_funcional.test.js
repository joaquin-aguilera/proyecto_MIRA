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

describe('Suite de Pruebas Extra-Funcionales (PX) - Tarea 6 (Max Latuz)', () => {

  // PX-02: Seguridad y Auditoría inalterable (RNF-02, DEC-01)
  test('PX-02 [Seguridad]: Bloquea permanentemente intentos de modificación o borrado en el rastro inalterable', async () => {
    // 1. Insertar un registro legítimo
    const log = await Auditoria.create({
      entidad: 'UMBRAL',
      entidad_id: new mongoose.Types.ObjectId().toString(),
      accion: 'REGISTRO_INICIAL',
      autor: 'Max Latuz',
      detalles: { motivo: 'Prueba de inmutabilidad' }
    });

    expect(log._id).toBeDefined();

    // 2. Intentar modificar el registro (Debe ser bloqueado por middleware Mongoose)
    await expect(
      Auditoria.updateOne({ _id: log._id }, { $set: { autor: 'Atacante Malicioso' } })
    ).rejects.toThrow('VIOLACION_RNF_02');

    // 3. Intentar eliminar el registro directamente (Debe ser bloqueado)
    await expect(
      Auditoria.deleteOne({ _id: log._id })
    ).rejects.toThrow('VIOLACION_RNF_02');

    // 4. Verificar que el dato sigue intacto e inalterado
    const logVerificado = await Auditoria.findById(log._id);
    expect(logVerificado.autor).toBe('Max Latuz');
  });

  // PX-05: Seguridad y Cumplimiento (RNF-05 / CU-03)
  test('PX-05 [Cumplimiento]: Interrumpe el despliegue productivo y exige exactamente 1 firma válida', async () => {
    // 1. Proponer un umbral
    const propuesta = await Umbral.create({
      version: 1,
      umbral_aprobacion: 85,
      umbral_rechazo: 45,
      autor_modificacion: 'Max Latuz',
      estado_publicacion: 'PENDIENTE'
    });

    // 2. Comprobar que en estado PENDIENTE no se encuentra como ACTIVO
    const umbralActivo = await Umbral.findOne({ estado_publicacion: 'ACTIVO' });
    expect(umbralActivo).toBeNull();

    // 3. Simular firma inválida o vacía
    const resInvalida = await request(app)
      .patch(`/api/umbrales/${propuesta._id}/firma`)
      .send({ oficial_cumplimiento: '' });

    expect(resInvalida.statusCode).toBe(400);

    // 4. Estampar firma válida del Oficial de Cumplimiento
    const resValida = await request(app)
      .patch(`/api/umbrales/${propuesta._id}/firma`)
      .send({
        oficial_cumplimiento: 'Oficial de Cumplimiento MIRA',
        token_firma: 'SIG-TOKEN-MIRA-2026'
      });

    expect(resValida.statusCode).toBe(200);
    expect(resValida.body.data.estado_publicacion).toBe('ACTIVO');
  });

});
