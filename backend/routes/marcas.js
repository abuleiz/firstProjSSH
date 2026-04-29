const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Lista marcas ativas — para selects do formulário de veículos
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, nome FROM marcas WHERE ativo = 1 ORDER BY nome');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar marcas' });
  }
});

// Todas as marcas com contagem de modelos ativos — tela de gerenciamento
router.get('/todas', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT m.id, m.nome, m.ativo,
          (SELECT COUNT(*) FROM modelos mo WHERE mo.marca_id = m.id AND mo.ativo = 1) AS modelos_ativos
        FROM marcas m
        ORDER BY m.nome
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar marcas' });
  }
});

// Busca marca por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, nome, ativo FROM marcas WHERE id = @id');
    const marca = result.recordset[0];
    if (!marca) return res.status(404).json({ erro: 'Marca não encontrada' });
    res.json(marca);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar marca' });
  }
});

// Cria nova marca
router.post('/', requireAdmin, async (req, res) => {
  const { nome } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nome', sql.VarChar, nome.trim())
      .query(`
        INSERT INTO marcas (nome) OUTPUT INSERTED.id VALUES (@nome)
      `);
    res.status(201).json({ id: result.recordset[0].id, nome: nome.trim() });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ erro: 'Marca já cadastrada' });
    res.status(500).json({ erro: 'Erro ao salvar marca' });
  }
});

// Atualiza marca
router.put('/:id', requireAdmin, async (req, res) => {
  const { nome } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id',   sql.Int,     req.params.id)
      .input('nome', sql.VarChar, nome.trim())
      .query('UPDATE marcas SET nome=@nome WHERE id=@id');
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Marca não encontrada' });
    res.json({ id: Number(req.params.id), nome: nome.trim() });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ erro: 'Marca já cadastrada' });
    res.status(500).json({ erro: 'Erro ao atualizar marca' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const resMarca = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM marcas WHERE id = @id');
    const marca = resMarca.recordset[0];
    if (!marca) return res.status(404).json({ erro: 'Marca não encontrada' });

    // Impede desativação se tiver modelos ativos vinculados
    if (marca.ativo) {
      const resCheck = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT COUNT(*) AS total FROM modelos WHERE marca_id = @id AND ativo = 1');
      if (resCheck.recordset[0].total > 0)
        return res.status(400).json({ erro: 'Não é possível desativar: existem modelos ativos vinculados a esta marca' });
    }

    const novoStatus = marca.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE marcas SET ativo=@ativo WHERE id=@id');
    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status da marca' });
  }
});

module.exports = router;
