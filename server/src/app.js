const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());

// Importar rutas
const umbralesRoutes = require('./routes/umbralesRoutes');
const casosRoutes = require('./routes/casosRoutes');

// Montar endpoints de la API
app.use('/api/umbrales', umbralesRoutes);
app.use('/api/casos', casosRoutes);

// Endpoint de verificación de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servicio MIRA Backend operativo' });
});

module.exports = app;
