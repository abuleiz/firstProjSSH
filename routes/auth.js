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
      .query('SELECT * FROM usuarios WHERE email = @email AND ativo = 1');

    const usuario = result.recordset[0];

    if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    req.session.userId = usuario.id;
    req.session.nome   = usuario.nome;
    req.session.email  = usuario.email;
    req.session.nivel  = usuario.nivel;

    res.json({ nome: usuario.nome, email: usuario.email, nivel: usuario.nivel });
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
  res.json({
    id:    req.session.userId,
    nome:  req.session.nome,
    email: req.session.email,
    nivel: req.session.nivel,
  });
});

module.exports = router;
