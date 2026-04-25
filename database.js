const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'clientes.db'));

// Habilita foreign keys e WAL para melhor performance
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
`);

module.exports = db;
