require('dotenv').config();
const sql    = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server:   process.env.DB_SERVER   || 'localhost',
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt:                process.env.DB_ENCRYPT    === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
  pool: {
    max:               10,
    min:               0,
    idleTimeoutMillis: 30000,
  },
};

// Instância nomeada (ex.: SQLEXPRESS) usa browser service — não combina com porta fixa
if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
} else {
  config.port = parseInt(process.env.DB_PORT) || 1433;
}

// Pool de conexões — resolvido uma vez e reusado por todas as rotas
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(async pool => {
    console.log('Conectado ao SQL Server com sucesso');
    await criarTabelas(pool);
    await seedAdmin(pool);
    return pool;
  });

// Erros fatais na inicialização encerram o processo com mensagem clara
poolPromise.catch(err => {
  console.error('Erro ao conectar ao SQL Server:', err.message);
  process.exit(1);
});

// ------------------------------------------------
// Criação das tabelas (executado apenas se não existirem)
// ------------------------------------------------
async function criarTabelas(pool) {
  await pool.request().query(`
    IF OBJECT_ID('clientes', 'U') IS NULL
    CREATE TABLE clientes (
      id               INT            PRIMARY KEY IDENTITY(1,1),
      nome             NVARCHAR(255)  NOT NULL,
      cpf              NVARCHAR(14)   NOT NULL,
      email            NVARCHAR(255)  NULL,
      data_nascimento  NVARCHAR(10)   NULL,
      endereco         NVARCHAR(500)  NULL,
      criado_em        DATETIME       DEFAULT GETDATE(),
      CONSTRAINT UQ_clientes_cpf UNIQUE (cpf)
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('contatos', 'U') IS NULL
    CREATE TABLE contatos (
      id          INT           PRIMARY KEY IDENTITY(1,1),
      cliente_id  INT           NOT NULL,
      telefone    NVARCHAR(20)  NOT NULL,
      tipo        NVARCHAR(15)  NOT NULL
        CHECK (tipo IN ('celular', 'trabalho', 'residencial')),
      CONSTRAINT FK_contatos_clientes
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('usuarios', 'U') IS NULL
    CREATE TABLE usuarios (
      id          INT            PRIMARY KEY IDENTITY(1,1),
      nome        NVARCHAR(255)  NOT NULL,
      email       NVARCHAR(255)  NOT NULL,
      senha_hash  NVARCHAR(255)  NOT NULL,
      nivel       NVARCHAR(10)   NOT NULL
        CHECK (nivel IN ('admin', 'usuario')),
      ativo       BIT            NOT NULL DEFAULT 1,
      criado_em   DATETIME       DEFAULT GETDATE(),
      CONSTRAINT UQ_usuarios_email UNIQUE (email)
    );
  `);
}

// ------------------------------------------------
// Seed: admin padrão na primeira execução
// ------------------------------------------------
async function seedAdmin(pool) {
  const resultado = await pool.request()
    .input('email', sql.NVarChar, 'admin@admin.com')
    .query('SELECT id FROM usuarios WHERE email = @email');

  if (resultado.recordset.length === 0) {
    const senhaHash = bcrypt.hashSync('admin123', 10);
    await pool.request()
      .input('nome',      sql.NVarChar, 'Administrador')
      .input('email',     sql.NVarChar, 'admin@admin.com')
      .input('senhaHash', sql.NVarChar, senhaHash)
      .input('nivel',     sql.NVarChar, 'admin')
      .query(`
        INSERT INTO usuarios (nome, email, senha_hash, nivel)
        VALUES (@nome, @email, @senhaHash, @nivel)
      `);
    console.log('Usuário admin criado — e-mail: admin@admin.com / senha: admin123');
  }
}

module.exports = { poolPromise, sql };
