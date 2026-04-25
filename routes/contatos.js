const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');

const TIPOS_VALIDOS = ['celular', 'trabalho', 'residencial'];

// Adiciona contato a um cliente
router.post('/cliente/:clienteId', async (req, res) => {
  const { telefone, tipo } = req.body;

  if (!telefone || !tipo) return res.status(400).json({ erro: 'Telefone e tipo são obrigatórios' });
  if (!TIPOS_VALIDOS.includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });

  try {
    const pool = await poolPromise;

    const resCliente = await pool.request()
      .input('clienteId', sql.Int, req.params.clienteId)
      .query('SELECT id FROM clientes WHERE id = @clienteId');

    if (!resCliente.recordset[0]) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    const result = await pool.request()
      .input('clienteId', sql.Int,      req.params.clienteId)
      .input('telefone',  sql.NVarChar, telefone)
      .input('tipo',      sql.NVarChar, tipo)
      .query(`
        INSERT INTO contatos (cliente_id, telefone, tipo)
        OUTPUT INSERTED.id
        VALUES (@clienteId, @telefone, @tipo)
      `);

    const id = result.recordset[0].id;
    res.status(201).json({ id, cliente_id: Number(req.params.clienteId), telefone, tipo });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar contato' });
  }
});

// Atualiza contato existente
router.put('/:id', async (req, res) => {
  const { telefone, tipo } = req.body;

  if (!telefone || !tipo) return res.status(400).json({ erro: 'Telefone e tipo são obrigatórios' });
  if (!TIPOS_VALIDOS.includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id',       sql.Int,      req.params.id)
      .input('telefone', sql.NVarChar, telefone)
      .input('tipo',     sql.NVarChar, tipo)
      .query('UPDATE contatos SET telefone=@telefone, tipo=@tipo WHERE id=@id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: 'Contato não encontrado' });
    }
    res.json({ id: Number(req.params.id), telefone, tipo });
  } catch (err) {
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

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: 'Contato não encontrado' });
    }
    res.json({ mensagem: 'Contato removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover contato' });
  }
});

module.exports = router;
