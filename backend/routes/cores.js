const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Lista cores ativas — para selects do formulário de veículos
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, nome FROM cores WHERE ativo = 1 ORDER BY nome');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar cores' });
  }
});

// Todas as cores — tela de gerenciamento
router.get('/todas', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT c.id, c.nome, c.ativo,
          (SELECT COUNT(*) FROM veiculos v WHERE v.cor_id = c.id AND v.ativo = 1) AS veiculos_ativos
        FROM cores c
        ORDER BY c.nome
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar cores' });
  }
});

// Busca cor por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, nome, ativo FROM cores WHERE id = @id');
    const cor = result.recordset[0];
    if (!cor) return res.status(404).json({ erro: 'Cor não encontrada' });
    res.json(cor);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar cor' });
  }
});

// Cria nova cor
router.post('/', requireAdmin, async (req, res) => {
  const { nome } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nome', sql.VarChar, nome.trim())
      .query(`
        INSERT INTO cores (nome) OUTPUT INSERTED.id VALUES (@nome)
      `);
    res.status(201).json({ id: result.recordset[0].id, nome: nome.trim() });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ erro: 'Cor já cadastrada' });
    res.status(500).json({ erro: 'Erro ao salvar cor' });
  }
});

// Atualiza cor
router.put('/:id', requireAdmin, async (req, res) => {
  const { nome } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id',   sql.Int,     req.params.id)
      .input('nome', sql.VarChar, nome.trim())
      .query('UPDATE cores SET nome=@nome WHERE id=@id');
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Cor não encontrada' });
    res.json({ id: Number(req.params.id), nome: nome.trim() });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ erro: 'Cor já cadastrada' });
    res.status(500).json({ erro: 'Erro ao atualizar cor' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const resCor = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM cores WHERE id = @id');
    const cor = resCor.recordset[0];
    if (!cor) return res.status(404).json({ erro: 'Cor não encontrada' });

    // Impede desativação se vinculada a veículos ativos
    if (cor.ativo) {
      const resCheck = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT COUNT(*) AS total FROM veiculos WHERE cor_id = @id AND ativo = 1');
      if (resCheck.recordset[0].total > 0)
        return res.status(400).json({ erro: 'Não é possível desativar: existem veículos ativos com esta cor' });
    }

    const novoStatus = cor.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE cores SET ativo=@ativo WHERE id=@id');
    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status da cor' });
  }
});

module.exports = router;
