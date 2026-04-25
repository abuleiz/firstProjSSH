const express = require('express');
const path = require('path');
const clientesRouter = require('./routes/clientes');
const contatosRouter = require('./routes/contatos');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/clientes', clientesRouter);
app.use('/api/contatos', contatosRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
