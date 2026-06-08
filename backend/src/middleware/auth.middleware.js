const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Verificar token JWT
const verificarToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select('-password');
    if (!req.usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (!req.usuario.activo) return res.status(403).json({ error: 'Usuario inactivo' });
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Verificar roles permitidos
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
      });
    }
    next();
  };
};

module.exports = { verificarToken, verificarRol };