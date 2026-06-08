const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Generar token JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!usuario.activo) return res.status(403).json({ error: 'Usuario inactivo' });

    const passwordOk = await usuario.compararPassword(password);
    if (!passwordOk) return res.status(401).json({ error: 'Credenciales inválidas' });

    res.json({
      token: generarToken(usuario._id),
      usuario: {
        id:     usuario._id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// POST /api/auth/registro (solo desarrollador)
const registro = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const usuario = await Usuario.create({ nombre, email, password, rol });
    res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: {
        id:     usuario._id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// GET /api/auth/perfil
const perfil = async (req, res) => {
  res.json(req.usuario);
};

module.exports = { login, registro, perfil };