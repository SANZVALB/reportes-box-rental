const router = require('express').Router();
const { login, registro, perfil } = require('../controllers/auth.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

// Público
router.post('/login', login);

// Solo desarrollador puede crear usuarios
router.post('/registro', verificarToken, verificarRol('desarrollador'), registro);

// Perfil del usuario logueado
router.get('/perfil', verificarToken, perfil);

module.exports = router;