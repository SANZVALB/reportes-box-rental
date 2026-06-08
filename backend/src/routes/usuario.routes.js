const router = require('express').Router();
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const Usuario = require('../models/Usuario');

// GET /api/usuarios — solo desarrollador y administrador
router.get('/', verificarToken, verificarRol('desarrollador', 'administrador'), async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/usuarios/:id
router.get('/:id', verificarToken, verificarRol('desarrollador', 'administrador'), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// PUT /api/usuarios/:id — actualizar rol, estado, reportes asignados
router.put('/:id', verificarToken, verificarRol('desarrollador', 'administrador'), async (req, res) => {
  try {
    const { nombre, rol, activo, reportesAsignados } = req.body;

    // Administrador no puede crear desarrolladores
    if (req.usuario.rol === 'administrador' && rol === 'desarrollador') {
      return res.status(403).json({ error: 'No podés asignar rol desarrollador' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nombre, rol, activo, reportesAsignados },
      { new: true }
    ).select('-password');

    res.json(usuario);
  } catch {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/usuarios/:id — solo desarrollador
router.delete('/:id', verificarToken, verificarRol('desarrollador'), async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;