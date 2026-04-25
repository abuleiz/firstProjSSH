const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const db = new Database(path.join(__dirname, 'clientes.db'));

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nome             TEXT NOT NULL,
    cpf              TEXT NOT NULL UNIQUE,
    email            TEXT,
    data_nascimento  TEXT,
    endereco         TEXT,
    criado_em        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contatos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER NOT NULL,
    telefone    TEXT NOT NULL,
    tipo        TEXT NOT NULL CHECK(tipo IN ('celular', 'trabalho', 'residencial')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    senha_hash  TEXT NOT NULL,
    nivel       TEXT NOT NULL CHECK(nivel IN ('admin', 'usuario')),
    ativo       INTEGER NOT NULL DEFAULT 1,
    criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed: cria admin padrão na primeira execução
const adminExiste = db.prepare("SELECT id FROM usuarios WHERE email = 'admin@admin.com'").get();
if (!adminExiste) {
  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES (?, ?, ?, ?)'
  ).run('Administrador', 'admin@admin.com', senhaHash, 'admin');
  console.log('Usuário admin criado — e-mail: admin@admin.com / senha: admin123');
}

module.exports = db;
