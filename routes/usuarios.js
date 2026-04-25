const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../database');
const { requireAdmin } = require('../middleware/auth');

// Todos os endpoints exigem perfil admin
router.use(requireAdmin);

// Lista todos os usuários
router.get('/', (req, res) => {
  const usuarios = db.prepare(
    'SELECT id, nome, email, nivel, ativo, criado_em FROM usuarios ORDER BY nome'
  ).all();
  res.json(usuarios);
});

// Busca usuário por id
router.get('/:id', (req, res) => {
  const usuario = db.prepare(
    'SELECT id, nome, email, nivel, ativo FROM usuarios WHERE id = ?'
  ).get(req.params.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(usuario);
});

// Cria novo usuário
router.post('/', (req, res) => {
  const { nome, email, senha, nivel } = req.body;

  if (!nome || !email || !senha || !nivel) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }
  if (!['admin', 'usuario'].includes(nivel)) {
    return res.status(400).json({ erro: 'Nível de acesso inválido' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);

  try {
    const result = db.prepare(
      'INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES (?, ?, ?, ?)'
    ).run(nome, email, senhaHash, nivel);

    res.status(201).json({ id: result.lastInsertRowid, nome, email, nivel, ativo: 1 });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// Atualiza dados do usuário (senha só é alterada se vier preenchida)
router.put('/:id', (req, res) => {
  const { nome, email, senha, nivel } = req.body;

  if (!nome || !email || !nivel) {
    return res.status(400).json({ erro: 'Nome, e-mail e nível são obrigatórios' });
  }
  if (!['admin', 'usuario'].includes(nivel)) {
    return res.status(400).json({ erro: 'Nível de acesso inválido' });
  }

  try {
    let result;
    if (senha && senha.trim().length > 0) {
      if (senha.trim().length < 6) {
        return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
      }
      const senhaHash = bcrypt.hashSync(senha.trim(), 10);
      result = db.prepare(
        'UPDATE usuarios SET nome=?, email=?, senha_hash=?, nivel=? WHERE id=?'
      ).run(nome, email, senhaHash, nivel, req.params.id);
    } else {
      result = db.prepare(
        'UPDATE usuarios SET nome=?, email=?, nivel=? WHERE id=?'
      ).run(nome, email, nivel, req.params.id);
    }

    if (result.changes === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json({ id: Number(req.params.id), nome, email, nivel });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

// Alterna status ativo/inativo (sem excluir do banco)
router.patch('/:id/status', (req, res) => {
  if (Number(req.params.id) === req.session.userId) {
    return res.status(400).json({ erro: 'Você não pode desativar sua própria conta' });
  }

  const usuario = db.prepare('SELECT ativo FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

  const novoStatus = usuario.ativo ? 0 : 1;
  db.prepare('UPDATE usuarios SET ativo=? WHERE id=?').run(novoStatus, req.params.id);

  res.json({ ativo: novoStatus });
});

module.exports = router;
