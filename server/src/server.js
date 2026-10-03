require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');
const Umbral = require('./models/Umbral');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Si no hay URI de Atlas configurada, levantamos base de datos local en memoria
    if (!mongoUri) {
      console.log('⚡ Iniciando MongoDB local en memoria para pruebas directas...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conexión exitosa a MongoDB');

    // Sembrar un umbral inicial activo si la base de datos está vacía
    const existeUmbral = await Umbral.findOne({ estado_publicacion: 'ACTIVO' });
    if (!existeUmbral) {
      await Umbral.create({
        version: 1,
        flujo_id: 'FLUJO_MIRA_GENERAL',
        umbral_aprobacion: 80,
        umbral_rechazo: 40,
        pesos_senales: { fraude: 0.4, ingresos: 0.3, identidad: 0.3 },
        estado_publicacion: 'ACTIVO',
        autor_modificacion: 'Sistema Inicial MIRA',
        firma_cumplimiento: {
          firmado_por: 'Oficial de Cumplimiento (Semilla)',
          fecha_firma: new Date(),
          token_firma: 'SIG-INIT-2026',
          valido: true
        }
      });
      console.log('🌱 Umbral inicial (Versión 1) sembrado en producción');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor MIRA Backend escuchando en http://localhost:${PORT}`);
      console.log(`📡 Endpoints disponibles en http://localhost:${PORT}/api/umbrales`);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
