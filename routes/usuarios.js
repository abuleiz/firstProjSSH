const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { poolPromise, sql } = require('../src/config/database');
const { requireAdmin }     = require('../middleware/auth');

// Todos os endpoints exigem perfil admin
router.use(requireAdmin);

// Lista todos os usuários
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, nome, email, nivel, ativo, criado_em FROM usuarios ORDER BY nome');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Busca usuário por id
router.get('/:id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, nome, email, nivel, ativo FROM usuarios WHERE id = @id');

    const usuario = result.recordset[0];
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
});

// Cria novo usuário
router.post('/', async (req, res) => {
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

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);
    const pool      = await poolPromise;
    const result    = await pool.request()
      .input('nome',      sql.NVarChar, nome)
      .input('email',     sql.NVarChar, email)
      .input('senhaHash', sql.NVarChar, senhaHash)
      .input('nivel',     sql.NVarChar, nivel)
      .query(`
        INSERT INTO usuarios (nome, email, senha_hash, nivel)
        OUTPUT INSERTED.id
        VALUES (@nome, @email, @senhaHash, @nivel)
      `);

    const id = result.recordset[0].id;
    res.status(201).json({ id, nome, email, nivel, ativo: true });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// Atualiza dados do usuário (senha só é alterada se vier preenchida)
router.put('/:id', async (req, res) => {
  const { nome, email, senha, nivel } = req.body;

  if (!nome || !email || !nivel) {
    return res.status(400).json({ erro: 'Nome, e-mail e nível são obrigatórios' });
  }
  if (!['admin', 'usuario'].includes(nivel)) {
    return res.status(400).json({ erro: 'Nível de acesso inválido' });
  }

  try {
    const pool = await poolPromise;
    let result;

    if (senha && senha.trim().length > 0) {
      if (senha.trim().length < 6) {
        return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
      }
      const senhaHash = bcrypt.hashSync(senha.trim(), 10);
      result = await pool.request()
        .input('id',        sql.Int,      req.params.id)
        .input('nome',      sql.NVarChar, nome)
        .input('email',     sql.NVarChar, email)
        .input('senhaHash', sql.NVarChar, senhaHash)
        .input('nivel',     sql.NVarChar, nivel)
        .query('UPDATE usuarios SET nome=@nome, email=@email, senha_hash=@senhaHash, nivel=@nivel WHERE id=@id');
    } else {
      result = await pool.request()
        .input('id',    sql.Int,      req.params.id)
        .input('nome',  sql.NVarChar, nome)
        .input('email', sql.NVarChar, email)
        .input('nivel', sql.NVarChar, nivel)
        .query('UPDATE usuarios SET nome=@nome, email=@email, nivel=@nivel WHERE id=@id');
    }

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json({ id: Number(req.params.id), nome, email, nivel });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

// Alterna status ativo/inativo (sem excluir do banco)
router.patch('/:id/status', async (req, res) => {
  if (Number(req.params.id) === req.session.userId) {
    return res.status(400).json({ erro: 'Você não pode desativar sua própria conta' });
  }

  try {
    const pool = await poolPromise;

    const resUsuario = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM usuarios WHERE id = @id');

    const usuario = resUsuario.recordset[0];
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    // BIT: true → desativa (0), false → ativa (1)
    const novoStatus = usuario.ativo ? 0 : 1;

    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE usuarios SET ativo=@ativo WHERE id=@id');

    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do usuário' });
  }
});

module.exports = router;
