require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectMongo } = require('./config/mongodb');

const votosRoutes = require('./routes/votos');
const reportesRoutes = require('./routes/reportes');
const archivosRoutes = require('./routes/archivos');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Seguridad basica ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));

// Limite de peticiones para evitar abuso del endpoint publico de votacion
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // 100 peticiones por IP en esa ventana
  message: { error: 'Demasiadas peticiones, intenta de nuevo mas tarde' }
});
app.use('/api/', limiter);

// --- Rutas ---
app.use('/api/votos', votosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/archivos', archivosRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'elecciones2026-backend', hora: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores generico (ej: multer fileFilter, JSON malformado)
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

async function iniciar() {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error fatal al iniciar el servidor:', err);
    process.exit(1);
  }
}

iniciar();
