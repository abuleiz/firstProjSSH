const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const VALIDACOES = ['telefone', 'email', 'texto'];

// Tipos ativos — para o select do formulário de contatos
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, nome, mascara, placeholder, validacao FROM tipos_contato WHERE ativo = 1 ORDER BY id');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar tipos de contato' });
  }
});

// Todos os tipos com contagem de contatos — tela de gerenciamento
router.get('/todos', requireAdmin, async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT t.id, t.nome, t.mascara, t.placeholder, t.validacao, t.ativo,
               COUNT(c.id) AS contatos_vinculados
        FROM tipos_contato t
        LEFT JOIN contatos c ON c.tipo_id = t.id
        GROUP BY t.id, t.nome, t.mascara, t.placeholder, t.validacao, t.ativo
        ORDER BY t.id
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar tipos de contato' });
  }
});

// Busca tipo por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, nome, mascara, placeholder, validacao, ativo FROM tipos_contato WHERE id = @id');
    const tipo = result.recordset[0];
    if (!tipo) return res.status(404).json({ erro: 'Tipo de contato não encontrado' });
    res.json(tipo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar tipo de contato' });
  }
});

// Cria novo tipo
router.post('/', requireAdmin, async (req, res) => {
  const { nome, mascara, placeholder, validacao, ativo } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!VALIDACOES.includes(validacao)) return res.status(400).json({ erro: 'Validação inválida' });

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('nome',        sql.VarChar, nome.trim())
      .input('mascara',     sql.VarChar, mascara?.trim()     || null)
      .input('placeholder', sql.VarChar, placeholder?.trim() || null)
      .input('validacao',   sql.VarChar, validacao)
      .input('ativo',       sql.Bit,     ativo ? 1 : 0)
      .query(`
        INSERT INTO tipos_contato (nome, mascara, placeholder, validacao, ativo)
        OUTPUT INSERTED.id
        VALUES (@nome, @mascara, @placeholder, @validacao, @ativo)
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar tipo de contato' });
  }
});

// Atualiza tipo
router.put('/:id', requireAdmin, async (req, res) => {
  const { nome, mascara, placeholder, validacao, ativo } = req.body;
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!VALIDACOES.includes(validacao)) return res.status(400).json({ erro: 'Validação inválida' });

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id',          sql.Int,     req.params.id)
      .input('nome',        sql.VarChar, nome.trim())
      .input('mascara',     sql.VarChar, mascara?.trim()     || null)
      .input('placeholder', sql.VarChar, placeholder?.trim() || null)
      .input('validacao',   sql.VarChar, validacao)
      .input('ativo',       sql.Bit,     ativo ? 1 : 0)
      .query(`
        UPDATE tipos_contato
        SET nome=@nome, mascara=@mascara, placeholder=@placeholder,
            validacao=@validacao, ativo=@ativo
        WHERE id=@id
      `);
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Tipo de contato não encontrado' });
    res.json({ id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar tipo de contato' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const pool     = await poolPromise;
    const resAtual = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM tipos_contato WHERE id = @id');

    const tipo = resAtual.recordset[0];
    if (!tipo) return res.status(404).json({ erro: 'Tipo de contato não encontrado' });

    // Ao desativar, verificar contatos vinculados
    if (tipo.ativo) {
      const resCont = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT COUNT(*) AS total FROM contatos WHERE tipo_id = @id');
      const total = resCont.recordset[0].total;
      if (total > 0) {
        return res.status(400).json({
          erro: `Este tipo está vinculado a ${total} contato(s) e não pode ser desativado`,
        });
      }
    }

    const novoStatus = tipo.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE tipos_contato SET ativo=@ativo WHERE id=@id');

    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do tipo de contato' });
  }
});

module.exports = router;
