const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Lista modelos ativos filtrados por marca — para selects do formulário de veículos
router.get('/', requireAuth, async (req, res) => {
  const { marca_id } = req.query;
  try {
    const pool = await poolPromise;
    let result;
    if (marca_id) {
      result = await pool.request()
        .input('marca_id', sql.Int, Number(marca_id))
        .query('SELECT id, nome, marca_id FROM modelos WHERE ativo = 1 AND marca_id = @marca_id ORDER BY nome');
    } else {
      result = await pool.request()
        .query('SELECT id, nome, marca_id FROM modelos WHERE ativo = 1 ORDER BY nome');
    }
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar modelos' });
  }
});

// Todos os modelos com marca e contagem de versões ativas — tela de gerenciamento
router.get('/todos', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT mo.id, mo.nome, mo.ativo, mo.marca_id,
               ma.nome AS marca_nome,
               (SELECT COUNT(*) FROM versoes v WHERE v.modelo_id = mo.id AND v.ativo = 1) AS versoes_ativas
        FROM modelos mo
        JOIN marcas ma ON ma.id = mo.marca_id
        ORDER BY ma.nome, mo.nome
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar modelos' });
  }
});

// Busca modelo por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT mo.id, mo.nome, mo.ativo, mo.marca_id, ma.nome AS marca_nome
        FROM modelos mo JOIN marcas ma ON ma.id = mo.marca_id
        WHERE mo.id = @id
      `);
    const modelo = result.recordset[0];
    if (!modelo) return res.status(404).json({ erro: 'Modelo não encontrado' });
    res.json(modelo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar modelo' });
  }
});

// Cria novo modelo
router.post('/', requireAdmin, async (req, res) => {
  const { nome, marca_id } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!marca_id)     return res.status(400).json({ erro: 'Marca é obrigatória' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nome',     sql.VarChar, nome.trim())
      .input('marca_id', sql.Int,     Number(marca_id))
      .query(`
        INSERT INTO modelos (nome, marca_id) OUTPUT INSERTED.id VALUES (@nome, @marca_id)
      `);
    res.status(201).json({ id: result.recordset[0].id, nome: nome.trim(), marca_id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar modelo' });
  }
});

// Atualiza modelo
router.put('/:id', requireAdmin, async (req, res) => {
  const { nome, marca_id } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!marca_id)     return res.status(400).json({ erro: 'Marca é obrigatória' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id',       sql.Int,     req.params.id)
      .input('nome',     sql.VarChar, nome.trim())
      .input('marca_id', sql.Int,     Number(marca_id))
      .query('UPDATE modelos SET nome=@nome, marca_id=@marca_id WHERE id=@id');
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Modelo não encontrado' });
    res.json({ id: Number(req.params.id), nome: nome.trim(), marca_id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar modelo' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const resModelo = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM modelos WHERE id = @id');
    const modelo = resModelo.recordset[0];
    if (!modelo) return res.status(404).json({ erro: 'Modelo não encontrado' });

    // Impede desativação se tiver versões ativas vinculadas
    if (modelo.ativo) {
      const resCheck = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT COUNT(*) AS total FROM versoes WHERE modelo_id = @id AND ativo = 1');
      if (resCheck.recordset[0].total > 0)
        return res.status(400).json({ erro: 'Não é possível desativar: existem versões ativas vinculadas a este modelo' });
    }

    const novoStatus = modelo.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE modelos SET ativo=@ativo WHERE id=@id');
    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do modelo' });
  }
});

module.exports = router;
