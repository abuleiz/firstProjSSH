const express = require('express');
const router = express.Router();
const db = require('../database');

const TIPOS_VALIDOS = ['celular', 'trabalho', 'residencial'];

// Adiciona contato a um cliente
router.post('/cliente/:clienteId', (req, res) => {
  const { telefone, tipo } = req.body;

  if (!telefone || !tipo) return res.status(400).json({ erro: 'Telefone e tipo são obrigatórios' });
  if (!TIPOS_VALIDOS.includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });

  const clienteExiste = db.prepare('SELECT id FROM clientes WHERE id = ?').get(req.params.clienteId);
  if (!clienteExiste) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const result = db.prepare(
    'INSERT INTO contatos (cliente_id, telefone, tipo) VALUES (?, ?, ?)'
  ).run(req.params.clienteId, telefone, tipo);

  res.status(201).json({ id: result.lastInsertRowid, cliente_id: Number(req.params.clienteId), telefone, tipo });
});

// Atualiza contato existente
router.put('/:id', (req, res) => {
  const { telefone, tipo } = req.body;

  if (!telefone || !tipo) return res.status(400).json({ erro: 'Telefone e tipo são obrigatórios' });
  if (!TIPOS_VALIDOS.includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });

  const result = db.prepare(
    'UPDATE contatos SET telefone=?, tipo=? WHERE id=?'
  ).run(telefone, tipo, req.params.id);

  if (result.changes === 0) return res.status(404).json({ erro: 'Contato não encontrado' });
  res.json({ id: Number(req.params.id), telefone, tipo });
});

// Remove contato
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contatos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ erro: 'Contato não encontrado' });
  res.json({ mensagem: 'Contato removido com sucesso' });
});

module.exports = router;
