const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { poolPromise, sql } = require('../src/config/database');

// Autentica o usuário e inicia sessão
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.id, u.nome, u.email, u.senha_hash, u.ativo,
          (SELECT MIN(p.nivel)
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id) AS perfil_nivel,
          (SELECT TOP 1 p.id
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id ORDER BY p.nivel ASC) AS perfil_id,
          (SELECT STRING_AGG(p.nome, ', ')
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id) AS perfil_nome
        FROM usuarios u
        WHERE u.email = @email AND u.ativo = 1
      `);

    const usuario = result.recordset[0];

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    req.session.userId       = usuario.id;
    req.session.nome         = usuario.nome;
    req.session.email        = usuario.email;
    req.session.perfil_id    = usuario.perfil_id;
    req.session.perfil_nivel = usuario.perfil_nivel;
    req.session.perfil_nome  = usuario.perfil_nome;

    // Campo derivado para compatibilidade com código existente do frontend
    const nivel = usuario.perfil_nivel === 1 ? 'admin' : 'usuario';
    req.session.nivel = nivel;

    res.json({
      id:           usuario.id,
      nome:         usuario.nome,
      email:        usuario.email,
      perfil_id:    usuario.perfil_id,
      perfil_nome:  usuario.perfil_nome,
      perfil_nivel: usuario.perfil_nivel,
      nivel,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao realizar login' });
  }
});

// Encerra a sessão
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ mensagem: 'Logout realizado com sucesso' });
  });
});

// Retorna dados do usuário logado — usado pelo frontend para checar autenticação
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  const nivel = req.session.perfil_nivel === 1 ? 'admin' : 'usuario';
  res.json({
    id:           req.session.userId,
    nome:         req.session.nome,
    email:        req.session.email,
    perfil_id:    req.session.perfil_id,
    perfil_nome:  req.session.perfil_nome,
    perfil_nivel: req.session.perfil_nivel,
    nivel,
  });
});

module.exports = router;
