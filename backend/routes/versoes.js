const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Lista versões ativas filtradas por modelo — para selects do formulário de veículos
router.get('/', requireAuth, async (req, res) => {
  const { modelo_id } = req.query;
  try {
    const pool = await poolPromise;
    let result;
    if (modelo_id) {
      result = await pool.request()
        .input('modelo_id', sql.Int, Number(modelo_id))
        .query('SELECT id, nome, modelo_id FROM versoes WHERE ativo = 1 AND modelo_id = @modelo_id ORDER BY nome');
    } else {
      result = await pool.request()
        .query('SELECT id, nome, modelo_id FROM versoes WHERE ativo = 1 ORDER BY nome');
    }
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar versões' });
  }
});

// Todas as versões com modelo e marca — tela de gerenciamento
router.get('/todas', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT v.id, v.nome, v.ativo, v.modelo_id,
               mo.nome AS modelo_nome, ma.nome AS marca_nome
        FROM versoes v
        JOIN modelos mo ON mo.id = v.modelo_id
        JOIN marcas  ma ON ma.id = mo.marca_id
        ORDER BY ma.nome, mo.nome, v.nome
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar versões' });
  }
});

// Busca versão por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT v.id, v.nome, v.ativo, v.modelo_id,
               mo.nome AS modelo_nome, mo.marca_id
        FROM versoes v JOIN modelos mo ON mo.id = v.modelo_id
        WHERE v.id = @id
      `);
    const versao = result.recordset[0];
    if (!versao) return res.status(404).json({ erro: 'Versão não encontrada' });
    res.json(versao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar versão' });
  }
});

// Cria nova versão
router.post('/', requireAdmin, async (req, res) => {
  const { nome, modelo_id } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!modelo_id)    return res.status(400).json({ erro: 'Modelo é obrigatório' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nome',      sql.VarChar, nome.trim())
      .input('modelo_id', sql.Int,     Number(modelo_id))
      .query(`
        INSERT INTO versoes (nome, modelo_id) OUTPUT INSERTED.id VALUES (@nome, @modelo_id)
      `);
    res.status(201).json({ id: result.recordset[0].id, nome: nome.trim(), modelo_id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar versão' });
  }
});

// Atualiza versão
router.put('/:id', requireAdmin, async (req, res) => {
  const { nome, modelo_id } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!modelo_id)    return res.status(400).json({ erro: 'Modelo é obrigatório' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id',        sql.Int,     req.params.id)
      .input('nome',      sql.VarChar, nome.trim())
      .input('modelo_id', sql.Int,     Number(modelo_id))
      .query('UPDATE versoes SET nome=@nome, modelo_id=@modelo_id WHERE id=@id');
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Versão não encontrada' });
    res.json({ id: Number(req.params.id), nome: nome.trim(), modelo_id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar versão' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const resVersao = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM versoes WHERE id = @id');
    const versao = resVersao.recordset[0];
    if (!versao) return res.status(404).json({ erro: 'Versão não encontrada' });

    // Impede desativação se vinculada a veículos ativos
    if (versao.ativo) {
      const resCheck = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT COUNT(*) AS total FROM veiculos WHERE versao_id = @id AND ativo = 1');
      if (resCheck.recordset[0].total > 0)
        return res.status(400).json({ erro: 'Não é possível desativar: existem veículos ativos com esta versão' });
    }

    const novoStatus = versao.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE versoes SET ativo=@ativo WHERE id=@id');
    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status da versão' });
  }
});

module.exports = router;
