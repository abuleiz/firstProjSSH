const express = require('express');
const router = express.Router();
const db = require('../database');

// Lista todos os clientes
router.get('/', (req, res) => {
  const clientes = db.prepare('SELECT * FROM clientes ORDER BY nome').all();
  res.json(clientes);
});

// Busca cliente por id junto com seus contatos
router.get('/:id', (req, res) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  cliente.contatos = db.prepare('SELECT * FROM contatos WHERE cliente_id = ?').all(req.params.id);
  res.json(cliente);
});

// Cria novo cliente
router.post('/', (req, res) => {
  const { nome, cpf, email, data_nascimento, endereco } = req.body;

  if (!nome || !cpf) return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });

  try {
    const result = db.prepare(
      'INSERT INTO clientes (nome, cpf, email, data_nascimento, endereco) VALUES (?, ?, ?, ?, ?)'
    ).run(nome, cpf, email || null, data_nascimento || null, endereco || null);

    res.status(201).json({ id: result.lastInsertRowid, nome, cpf, email, data_nascimento, endereco });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'CPF já cadastrado' });
    res.status(500).json({ erro: 'Erro ao salvar cliente' });
  }
});

// Atualiza cliente existente
router.put('/:id', (req, res) => {
  const { nome, cpf, email, data_nascimento, endereco } = req.body;

  if (!nome || !cpf) return res.status(400).json({ erro: 'Nome e CPF são obrigatórios' });

  try {
    const result = db.prepare(
      'UPDATE clientes SET nome=?, cpf=?, email=?, data_nascimento=?, endereco=? WHERE id=?'
    ).run(nome, cpf, email || null, data_nascimento || null, endereco || null, req.params.id);

    if (result.changes === 0) return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.json({ id: Number(req.params.id), nome, cpf, email, data_nascimento, endereco });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'CPF já cadastrado' });
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
});

// Remove cliente (contatos removidos em cascata pelo banco)
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json({ mensagem: 'Cliente removido com sucesso' });
});

module.exports = router;
