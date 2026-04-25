function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
  if (req.session.nivel !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
