const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');

async function buscarTipo(pool, tipo_id) {
  const result = await pool.request()
    .input('tipo_id', sql.Int, tipo_id)
    .query('SELECT id, validacao, mascara FROM tipos_contato WHERE id = @tipo_id AND ativo = 1');
  return result.recordset[0] || null;
}

function validarValor(tipo, valor) {
  const v = valor.trim();
  if (!v) return 'O contato não pode estar vazio';

  if (tipo.validacao === 'email') {
    const partes = v.split('@');
    if (partes.length !== 2 || !partes[1].includes('.')) return 'E-mail inválido';
    return null;
  }

  if (tipo.validacao === 'telefone') {
    const maxDigits = tipo.mascara ? (tipo.mascara.match(/9/g) || []).length : 0;
    const digits = v.replace(/\D/g, '');
    if (maxDigits && digits.length !== maxDigits)
      return `Deve ter ${maxDigits} dígitos numéricos`;
    return null;
  }

  return null; // 'texto': aceita qualquer valor
}

// Adiciona contato a um cliente
router.post('/cliente/:clienteId', async (req, res) => {
  const { telefone, tipo_id } = req.body;

  if (!telefone || !tipo_id) return res.status(400).json({ erro: 'Contato e tipo são obrigatórios' });

  try {
    const pool = await poolPromise;

    const tipo = await buscarTipo(pool, tipo_id);
    if (!tipo) return res.status(400).json({ erro: 'Tipo de contato inválido ou inativo' });

    const erroValidacao = validarValor(tipo, telefone);
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

    const resCliente = await pool.request()
      .input('clienteId', sql.Int, req.params.clienteId)
      .query('SELECT id FROM clientes WHERE id = @clienteId');
    if (!resCliente.recordset[0]) return res.status(404).json({ erro: 'Cliente não encontrado' });

    const result = await pool.request()
      .input('clienteId', sql.Int,      req.params.clienteId)
      .input('telefone',  sql.NVarChar, telefone.trim())
      .input('tipo_id',   sql.Int,      tipo_id)
      .query(`
        INSERT INTO contatos (cliente_id, telefone, tipo_id)
        OUTPUT INSERTED.id
        VALUES (@clienteId, @telefone, @tipo_id)
      `);

    const id = result.recordset[0].id;
    res.status(201).json({ id, cliente_id: Number(req.params.clienteId), telefone: telefone.trim(), tipo_id });
  } catch (err) {
    console.error('Erro ao salvar contato:', err.message);
    res.status(500).json({ erro: 'Erro ao salvar contato' });
  }
});

// Atualiza contato existente
router.put('/:id', async (req, res) => {
  const { telefone, tipo_id } = req.body;

  if (!telefone || !tipo_id) return res.status(400).json({ erro: 'Contato e tipo são obrigatórios' });

  try {
    const pool = await poolPromise;

    const tipo = await buscarTipo(pool, tipo_id);
    if (!tipo) return res.status(400).json({ erro: 'Tipo de contato inválido ou inativo' });

    const erroValidacao = validarValor(tipo, telefone);
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

    const result = await pool.request()
      .input('id',       sql.Int,      req.params.id)
      .input('telefone', sql.NVarChar, telefone.trim())
      .input('tipo_id',  sql.Int,      tipo_id)
      .query('UPDATE contatos SET telefone=@telefone, tipo_id=@tipo_id WHERE id=@id');

    if (result.rowsAffected[0] === 0) return res.status(404).json({ erro: 'Contato não encontrado' });
    res.json({ id: Number(req.params.id), telefone: telefone.trim(), tipo_id });
  } catch (err) {
    console.error('Erro ao atualizar contato:', err.message);
    res.status(500).json({ erro: 'Erro ao atualizar contato' });
  }
});

// Remove contato
router.delete('/:id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM contatos WHERE id = @id');

    if (result.rowsAffected[0] === 0) return res.status(404).json({ erro: 'Contato não encontrado' });
    res.json({ mensagem: 'Contato removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover contato:', err.message);
    res.status(500).json({ erro: 'Erro ao remover contato' });
  }
});

module.exports = router;
