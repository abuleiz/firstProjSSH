require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const cors     = require('cors');
const path     = require('path');

const { poolPromise }     = require('./src/config/database');
const clientesRouter      = require('./routes/clientes');
const contatosRouter      = require('./routes/contatos');
const tiposContatoRouter  = require('./routes/tipos-contato');
const authRouter          = require('./routes/auth');
const usuariosRouter      = require('./routes/usuarios');
const menusRouter         = require('./routes/menus');
const perfisRouter        = require('./routes/perfis');
const marcasRouter        = require('./routes/marcas');
const modelosRouter       = require('./routes/modelos');
const versoesRouter       = require('./routes/versoes');
const coresRouter         = require('./routes/cores');
const veiculosRouter      = require('./routes/veiculos');
const { requireAuth }     = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret:            process.env.SESSION_SECRET || 'cadastro-clientes-fallback-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   8 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  },
}));

app.use('/api/auth', authRouter);

app.use('/api/clientes',      requireAuth, clientesRouter);
app.use('/api/contatos',      requireAuth, contatosRouter);
app.use('/api/tipos-contato', tiposContatoRouter);
app.use('/api/usuarios',      usuariosRouter);
app.use('/api/menus',         menusRouter);
app.use('/api/perfis',        perfisRouter);
app.use('/api/marcas',        marcasRouter);
app.use('/api/modelos',       modelosRouter);
app.use('/api/versoes',       versoesRouter);
app.use('/api/cores',         coresRouter);
app.use('/api/veiculos',      requireAuth, veiculosRouter);

poolPromise.then(() => {
  app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
  });
});
