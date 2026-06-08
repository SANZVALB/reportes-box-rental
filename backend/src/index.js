const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/reportes', require('./routes/reporte.routes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Box Rental funcionando ✓', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Conexión a MongoDB y arranque del servidor
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✓ MongoDB conectado');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`✓ Servidor corriendo en puerto ${process.env.PORT || 3000}`);
    });
  })
  .catch(err => console.error('✗ Error MongoDB:', err));