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
      .query(`
        SELECT u.id, u.nome, u.email, u.ativo, u.criado_em,
          (SELECT MIN(p.nivel)
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id) AS perfil_nivel,
          (SELECT STRING_AGG(p.nome, ', ')
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id) AS perfis_nomes
        FROM usuarios u
        ORDER BY u.nome
      `);
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
      .query(`
        SELECT u.id, u.nome, u.email, u.ativo,
          (SELECT MIN(p.nivel)
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id) AS perfil_nivel,
          (SELECT STRING_AGG(p.nome, ', ')
           FROM usuario_perfis up JOIN perfis p ON p.id = up.perfil_id
           WHERE up.usuario_id = u.id) AS perfis_nomes
        FROM usuarios u
        WHERE u.id = @id
      `);
    const usuario = result.recordset[0];
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
});

// Cria novo usuário
router.post('/', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha)
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
  if (senha.length < 6)
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });

  try {
    const pool      = await poolPromise;
    const senhaHash = bcrypt.hashSync(senha, 10);
    const result    = await pool.request()
      .input('nome',      sql.NVarChar, nome)
      .input('email',     sql.NVarChar, email)
      .input('senhaHash', sql.NVarChar, senhaHash)
      .query(`
        INSERT INTO usuarios (nome, email, senha_hash)
        OUTPUT INSERTED.id
        VALUES (@nome, @email, @senhaHash)
      `);

    const id = result.recordset[0].id;
    res.status(201).json({ id, nome, email, ativo: true });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
});

// Atualiza dados do usuário (senha só é alterada se vier preenchida)
router.put('/:id', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email)
    return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios' });

  try {
    const pool = await poolPromise;
    let result;

    if (senha && senha.trim().length > 0) {
      if (senha.trim().length < 6)
        return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
      const senhaHash = bcrypt.hashSync(senha.trim(), 10);
      result = await pool.request()
        .input('id',        sql.Int,      req.params.id)
        .input('nome',      sql.NVarChar, nome)
        .input('email',     sql.NVarChar, email)
        .input('senhaHash', sql.NVarChar, senhaHash)
        .query('UPDATE usuarios SET nome=@nome, email=@email, senha_hash=@senhaHash WHERE id=@id');
    } else {
      result = await pool.request()
        .input('id',    sql.Int,      req.params.id)
        .input('nome',  sql.NVarChar, nome)
        .input('email', sql.NVarChar, email)
        .query('UPDATE usuarios SET nome=@nome, email=@email WHERE id=@id');
    }

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json({ id: Number(req.params.id), nome, email });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

// Alterna status ativo/inativo
router.patch('/:id/status', async (req, res) => {
  if (Number(req.params.id) === req.session.userId)
    return res.status(400).json({ erro: 'Você não pode desativar sua própria conta' });

  try {
    const pool       = await poolPromise;
    const resUsuario = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM usuarios WHERE id = @id');

    const usuario = resUsuario.recordset[0];
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

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

// Lista perfis atribuídos ao usuário
router.get('/:id/perfis', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT p.id, p.nome, p.descricao, p.nivel
        FROM usuario_perfis up
        JOIN perfis p ON p.id = up.perfil_id
        WHERE up.usuario_id = @id
        ORDER BY p.nivel, p.nome
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar perfis do usuário' });
  }
});

// Atribui perfil ao usuário
router.post('/:id/perfis', async (req, res) => {
  const { perfil_id } = req.body;
  if (!perfil_id) return res.status(400).json({ erro: 'perfil_id é obrigatório' });

  try {
    const pool = await poolPromise;

    const resPerfil = await pool.request()
      .input('perfil_id', sql.Int, perfil_id)
      .query('SELECT id FROM perfis WHERE id = @perfil_id AND ativo = 1');
    if (!resPerfil.recordset[0])
      return res.status(400).json({ erro: 'Perfil inválido ou inativo' });

    const resExiste = await pool.request()
      .input('usuario_id', sql.Int, req.params.id)
      .input('perfil_id',  sql.Int, perfil_id)
      .query('SELECT 1 AS tem FROM usuario_perfis WHERE usuario_id = @usuario_id AND perfil_id = @perfil_id');
    if (resExiste.recordset[0])
      return res.status(400).json({ erro: 'Este perfil já está atribuído ao usuário' });

    await pool.request()
      .input('usuario_id', sql.Int, req.params.id)
      .input('perfil_id',  sql.Int, perfil_id)
      .query('INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES (@usuario_id, @perfil_id)');

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atribuir perfil ao usuário' });
  }
});

// Remove perfil do usuário
router.delete('/:id/perfis/:perfilId', async (req, res) => {
  try {
    const pool     = await poolPromise;
    const resCount = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT COUNT(*) AS total FROM usuario_perfis WHERE usuario_id = @id');

    if (resCount.recordset[0].total <= 1)
      return res.status(400).json({ erro: 'O usuário deve ter pelo menos um perfil' });

    await pool.request()
      .input('usuario_id', sql.Int, req.params.id)
      .input('perfil_id',  sql.Int, req.params.perfilId)
      .query('DELETE FROM usuario_perfis WHERE usuario_id = @usuario_id AND perfil_id = @perfil_id');

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover perfil do usuário' });
  }
});

module.exports = router;
