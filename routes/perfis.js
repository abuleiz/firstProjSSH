const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Perfis ativos — para selects em formulários
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, nome, descricao FROM perfis WHERE ativo = 1 ORDER BY nivel');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar perfis' });
  }
});

// Todos os perfis com contagem de usuários ativos — tela de gerenciamento
// Deve vir antes de /:id para evitar conflito de rota
router.get('/todos', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT p.id, p.nome, p.descricao, p.ativo, p.nivel,
               COUNT(CASE WHEN u.ativo = 1 THEN 1 END) AS usuarios_ativos
        FROM perfis p
        LEFT JOIN usuario_perfis up ON up.perfil_id = p.id
        LEFT JOIN usuarios u ON u.id = up.usuario_id
        GROUP BY p.id, p.nome, p.descricao, p.ativo, p.nivel
        ORDER BY p.nivel
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar perfis' });
  }
});

// Busca perfil por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, nome, descricao, ativo, nivel FROM perfis WHERE id = @id');
    const perfil = result.recordset[0];
    if (!perfil) return res.status(404).json({ erro: 'Perfil não encontrado' });
    res.json(perfil);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});

// Cria novo perfil
router.post('/', requireAdmin, async (req, res) => {
  const { nome, descricao, ativo } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('nome',      sql.VarChar, nome.trim())
      .input('descricao', sql.VarChar, descricao?.trim() || null)
      .input('ativo',     sql.Bit,     ativo ? 1 : 0)
      .input('nivel',     sql.Int,     2) // novos perfis com nivel=2 (padrão de acesso básico)
      .query(`
        INSERT INTO perfis (nome, descricao, ativo, nivel)
        OUTPUT INSERTED.id
        VALUES (@nome, @descricao, @ativo, @nivel)
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar perfil' });
  }
});

// Atualiza perfil (Administrador — nivel=1 — não pode ser editado)
router.put('/:id', requireAdmin, async (req, res) => {
  const { nome, descricao, ativo } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });

  try {
    const pool     = await poolPromise;
    const resAtual = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT nivel FROM perfis WHERE id = @id');

    const perfil = resAtual.recordset[0];
    if (!perfil) return res.status(404).json({ erro: 'Perfil não encontrado' });
    if (perfil.nivel === 1)
      return res.status(400).json({ erro: 'O perfil Administrador não pode ser editado' });

    await pool.request()
      .input('id',        sql.Int,     req.params.id)
      .input('nome',      sql.VarChar, nome.trim())
      .input('descricao', sql.VarChar, descricao?.trim() || null)
      .input('ativo',     sql.Bit,     ativo ? 1 : 0)
      .query('UPDATE perfis SET nome=@nome, descricao=@descricao, ativo=@ativo WHERE id=@id');

    res.json({ id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const pool     = await poolPromise;
    const resAtual = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo, nivel FROM perfis WHERE id = @id');

    const perfil = resAtual.recordset[0];
    if (!perfil) return res.status(404).json({ erro: 'Perfil não encontrado' });
    if (perfil.nivel === 1)
      return res.status(400).json({ erro: 'O perfil Administrador não pode ser desativado' });

    // Ao desativar, verificar usuários ativos vinculados
    if (perfil.ativo) {
      const resUsu = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT COUNT(*) AS total
          FROM usuario_perfis up
          JOIN usuarios u ON u.id = up.usuario_id
          WHERE up.perfil_id = @id AND u.ativo = 1
        `);
      const total = resUsu.recordset[0].total;
      if (total > 0) {
        return res.status(400).json({
          erro: `Este perfil está vinculado a ${total} usuário(s) ativo(s) e não pode ser desativado`,
        });
      }
    }

    const novoStatus = perfil.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE perfis SET ativo=@ativo WHERE id=@id');

    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do perfil' });
  }
});

module.exports = router;
