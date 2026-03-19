const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ erro: 'Token inválido ou expirado' });
  }
}

function authOptional(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (token) {
    try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
}

function requirePerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ erro: 'Não autenticado' });
    if (!perfis.includes(req.usuario.perfil))
      return res.status(403).json({ erro: 'Acesso negado' });
    next();
  };
}

module.exports = { authRequired, authOptional, requirePerfil };
