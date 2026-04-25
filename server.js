const express  = require('express');
const session  = require('express-session');
const path     = require('path');

const clientesRouter  = require('./routes/clientes');
const contatosRouter  = require('./routes/contatos');
const authRouter      = require('./routes/auth');
const usuariosRouter  = require('./routes/usuarios');
const { requireAuth } = require('./middleware/auth');

const app  = express();
const PORT = 3000;

app.use(express.json());

app.use(session({
  secret:            'cadastro-clientes-secret-key',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   8 * 60 * 60 * 1000, // 8 horas
    httpOnly: true,
  },
}));

app.use(express.static(path.join(__dirname, 'public')));

// Rota pública: autenticação
app.use('/api/auth', authRouter);

// Rotas protegidas: exigem sessão ativa
app.use('/api/clientes', requireAuth, clientesRouter);
app.use('/api/contatos', requireAuth, contatosRouter);
app.use('/api/usuarios', usuariosRouter); // requireAdmin está dentro do próprio router

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
