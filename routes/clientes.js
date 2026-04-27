const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');

// Lista todos os clientes
router.get('/', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM clientes ORDER BY nome');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar clientes' });
  }
});

// Busca cliente por id com seus contatos
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;

    const resCliente = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM clientes WHERE id = @id');

    const cliente = resCliente.recordset[0];
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

    const resContatos = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT c.id, c.cliente_id, c.telefone, c.tipo_id, tc.nome AS tipo_nome
        FROM contatos c
        JOIN tipos_contato tc ON tc.id = c.tipo_id
        WHERE c.cliente_id = @id
        ORDER BY c.id
      `);

    cliente.contatos = resContatos.recordset;
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar cliente' });
  }
});

// Cria novo cliente
router.post('/', async (req, res) => {
  const { nome, cpf, email, data_nascimento, endereco } = req.body;

  if (!nome || !cpf) return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('nome',            sql.NVarChar, nome)
      .input('cpf',             sql.NVarChar, cpf)
      .input('email',           sql.NVarChar, email           || null)
      .input('data_nascimento', sql.NVarChar, data_nascimento || null)
      .input('endereco',        sql.NVarChar, endereco        || null)
      .query(`
        INSERT INTO clientes (nome, cpf, email, data_nascimento, endereco)
        OUTPUT INSERTED.id
        VALUES (@nome, @cpf, @email, @data_nascimento, @endereco)
      `);

    const id = result.recordset[0].id;
    res.status(201).json({ id, nome, cpf, email, data_nascimento, endereco });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ erro: 'CPF já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao salvar cliente' });
  }
});

// Atualiza cliente existente
router.put('/:id', async (req, res) => {
  const { nome, cpf, email, data_nascimento, endereco } = req.body;

  if (!nome || !cpf) return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });

  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id',              sql.Int,      req.params.id)
      .input('nome',            sql.NVarChar, nome)
      .input('cpf',             sql.NVarChar, cpf)
      .input('email',           sql.NVarChar, email           || null)
      .input('data_nascimento', sql.NVarChar, data_nascimento || null)
      .input('endereco',        sql.NVarChar, endereco        || null)
      .query(`
        UPDATE clientes
        SET nome=@nome, cpf=@cpf, email=@email,
            data_nascimento=@data_nascimento, endereco=@endereco
        WHERE id=@id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json({ id: Number(req.params.id), nome, cpf, email, data_nascimento, endereco });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ erro: 'CPF já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
});

// Remove cliente (contatos removidos em cascata pelo banco)
router.delete('/:id', async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM clientes WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json({ mensagem: 'Cliente removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover cliente' });
  }
});

module.exports = router;
