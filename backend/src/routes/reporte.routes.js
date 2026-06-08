const router  = require('express').Router();
const multer  = require('multer');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const {
  subirReporte,
  listarReportes,
  obtenerReporte,
  eliminarReporte
} = require('../controllers/reporte.controller');

// Multer en memoria — no guarda en disco, pasa el buffer directo al procesador
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const validos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (validos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten archivos .xlsx o .xls'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB máximo
});

// POST /api/reportes — subir y procesar Excel (operador, administrador, desarrollador)
router.post('/',
  verificarToken,
  verificarRol('desarrollador', 'administrador', 'operador'),
  upload.single('archivo'),
  subirReporte
);

// GET /api/reportes — listar reportes según rol
router.get('/',
  verificarToken,
  listarReportes
);

// GET /api/reportes/:id — ver reporte completo con datos
router.get('/:id',
  verificarToken,
  obtenerReporte
);

// DELETE /api/reportes/:id — solo desarrollador y administrador
router.delete('/:id',
  verificarToken,
  verificarRol('desarrollador', 'administrador'),
  eliminarReporte
);

module.exports = router;