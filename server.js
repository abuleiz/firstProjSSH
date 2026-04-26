require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const path     = require('path');

const { poolPromise }     = require('./src/config/database');
const clientesRouter      = require('./routes/clientes');
const contatosRouter      = require('./routes/contatos');
const authRouter          = require('./routes/auth');
const usuariosRouter      = require('./routes/usuarios');
const menusRouter         = require('./routes/menus');
const perfisRouter        = require('./routes/perfis');
const { requireAuth }     = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(session({
  secret:            process.env.SESSION_SECRET || 'cadastro-clientes-fallback-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   8 * 60 * 60 * 1000, // 8 horas
    httpOnly: true,
  },
}));

app.use(express.static(path.join(__dirname, 'public')));

// Rota pública
app.use('/api/auth', authRouter);

// Rotas protegidas
app.use('/api/clientes', requireAuth, clientesRouter);
app.use('/api/contatos', requireAuth, contatosRouter);
app.use('/api/usuarios', usuariosRouter); // requireAdmin está dentro do router
app.use('/api/menus',   menusRouter);
app.use('/api/perfis',  perfisRouter);

// Aguarda a conexão com o banco antes de abrir a porta
poolPromise
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  });
