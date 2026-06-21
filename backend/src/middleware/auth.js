/**
 * Middleware muy simple para proteger endpoints sensibles (ej: borrar datos).
 * No reemplaza un sistema de autenticación completo (Supabase Auth, Auth0, etc.)
 * pero es suficiente como capa minima de proteccion para este proyecto.
 *
 * El cliente debe enviar: Authorization: Bearer <ADMIN_TOKEN>
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  next();
}

module.exports = { requireAdmin };
