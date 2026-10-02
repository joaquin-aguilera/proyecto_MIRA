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

describe('Pruebas Extra-Funcionales Automatizadas (RNF-02, RNF-05, DEC-01)', () => {

  // PX-02: Seguridad y Auditoría inalterable (RNF-02 / DEC-01)
  describe('PX-02 [RNF-02 / DEC-01]: Inalterabilidad Estricta de la Colección de Auditoría (Append-Only)', () => {
    test('PX-02: Intentos programáticos de modificar (updateOne) un registro de auditoría son bloqueados', async () => {
      // 1. Crear un registro de auditoría legítimo
      const registro = await Auditoria.create({
        entidad: 'UMBRAL',
        entidad_id: 'TEST-ENTIDAD-001',
        accion: 'PROPUESTA_CREADA',
        autor: 'Max Latuz',
        detalles: { valor: 85 }
      });

      // 2. Intentar modificar programáticamente el registro con updateOne
      await expect(
        Auditoria.updateOne({ _id: registro._id }, { $set: { autor: 'Atacante Malicioso' } })
      ).rejects.toThrow('VIOLACION_RNF_02');

      // 3. Verificar que el registro permanezca intacto en la base de datos
      const registroVerificado = await Auditoria.findById(registro._id);
      expect(registroVerificado.autor).toBe('Max Latuz');
    });

    test('PX-02: Intentos programáticos de eliminar (deleteOne) un registro de auditoría son bloqueados', async () => {
      // 1. Crear un registro de auditoría legítimo
      const registro = await Auditoria.create({
        entidad: 'CASO',
        entidad_id: 'CASO-AUDIT-001',
        accion: 'EVALUACION_DECISION_F4',
        autor: 'MOTOR_F4',
        detalles: { estado_decision: 'APROBADO' }
      });

      // 2. Intentar eliminar programáticamente el registro con deleteOne
      await expect(
        Auditoria.deleteOne({ _id: registro._id })
      ).rejects.toThrow('VIOLACION_RNF_02');

      // 3. Verificar que el registro aún existe en la base de datos
      const registroExiste = await Auditoria.findById(registro._id);
      expect(registroExiste).not.toBeNull();
    });
  });

  // PX-05: Seguridad y Cumplimiento (RNF-05 / CU-03)
  describe('PX-05 [RNF-05 / CU-03]: Interrupción de Despliegue sin Firma de Cumplimiento', () => {
    test('PX-05: Interrumpe activación productiva si falta token o firma del Oficial de Cumplimiento', async () => {
      const propuesta = await Umbral.create({
        version: 1,
        umbral_aprobacion: 90,
        umbral_rechazo: 60,
        autor_modificacion: 'Max Latuz',
        estado_publicacion: 'PENDIENTE'
      });

      // Intento sin credenciales de cumplimiento
      const resInvalido = await request(app)
        .patch(`/api/umbrales/${propuesta._id}/firma`)
        .send({ oficial_cumplimiento: '' });

      expect(resInvalido.statusCode).toBe(400);
      expect(resInvalido.body.error).toContain('Violacion RNF-05');

      // Umbral debe permanecer PENDIENTE
      const umbralSinCambios = await Umbral.findById(propuesta._id);
      expect(umbralSinCambios.estado_publicacion).toBe('PENDIENTE');

      // Despliegue productivo exitoso con token válido
      const resValido = await request(app)
        .patch(`/api/umbrales/${propuesta._id}/firma`)
        .send({
          oficial_cumplimiento: 'Oficial de Cumplimiento MIRA',
          token_firma: 'TOKEN-OFICIAL-SECURE-2026'
        });

      expect(resValido.statusCode).toBe(200);
      expect(resValido.body.data.estado_publicacion).toBe('ACTIVO');
    });
  });
});
