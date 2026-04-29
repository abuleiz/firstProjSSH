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
    await seedMenus(pool);
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
  // perfis deve existir antes de usuarios (referenciado por FK)
  await pool.request().query(`
    IF OBJECT_ID('perfis', 'U') IS NULL
    BEGIN
      CREATE TABLE perfis (
        id        INT          IDENTITY(1,1) PRIMARY KEY,
        nome      VARCHAR(100) NOT NULL,
        descricao VARCHAR(255) NULL,
        ativo     BIT          NOT NULL DEFAULT 1,
        nivel     INT          NOT NULL DEFAULT 0
      );
      INSERT INTO perfis (nome, descricao, ativo, nivel) VALUES
        ('Administrador', 'Acesso total ao sistema',  1, 1),
        ('Usuário',       'Acesso padrão ao sistema', 1, 2);
    END
  `);

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
    IF OBJECT_ID('tipos_contato', 'U') IS NULL
    BEGIN
      CREATE TABLE tipos_contato (
        id          INT          IDENTITY(1,1) PRIMARY KEY,
        nome        VARCHAR(100) NOT NULL,
        mascara     VARCHAR(50)  NULL,
        placeholder VARCHAR(100) NULL,
        validacao   VARCHAR(20)  NOT NULL DEFAULT 'texto',
        ativo       BIT          NOT NULL DEFAULT 1
      );
      INSERT INTO tipos_contato (nome, mascara, placeholder, validacao) VALUES
        ('Celular',     '(99) 99999-9999', '(99) 99999-9999', 'telefone'),
        ('Trabalho',    '(99) 9999-9999',  '(99) 9999-9999',  'telefone'),
        ('Residencial', '(99) 9999-9999',  '(99) 9999-9999',  'telefone'),
        ('E-mail',      '',                'exemplo@email.com', 'email');
    END
  `);

  await pool.request().query(`
    IF OBJECT_ID('contatos', 'U') IS NULL
    CREATE TABLE contatos (
      id          INT           PRIMARY KEY IDENTITY(1,1),
      cliente_id  INT           NOT NULL,
      telefone    NVARCHAR(255) NOT NULL,
      tipo_id     INT           NOT NULL,
      CONSTRAINT FK_contatos_clientes
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      CONSTRAINT FK_contatos_tipos
        FOREIGN KEY (tipo_id) REFERENCES tipos_contato(id)
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('usuarios', 'U') IS NULL
    CREATE TABLE usuarios (
      id          INT            PRIMARY KEY IDENTITY(1,1),
      nome        NVARCHAR(255)  NOT NULL,
      email       NVARCHAR(255)  NOT NULL,
      senha_hash  NVARCHAR(255)  NOT NULL,
      ativo       BIT            NOT NULL DEFAULT 1,
      criado_em   DATETIME       DEFAULT GETDATE(),
      CONSTRAINT UQ_usuarios_email UNIQUE (email)
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('usuario_perfis', 'U') IS NULL
    CREATE TABLE usuario_perfis (
      usuario_id INT NOT NULL,
      perfil_id  INT NOT NULL,
      CONSTRAINT PK_usuario_perfis PRIMARY KEY (usuario_id, perfil_id),
      CONSTRAINT FK_up_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      CONSTRAINT FK_up_perfil  FOREIGN KEY (perfil_id)  REFERENCES perfis(id)
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('menus', 'U') IS NULL
    CREATE TABLE menus (
      id        INT          IDENTITY(1,1) PRIMARY KEY,
      label     VARCHAR(100) NOT NULL,
      icon      VARCHAR(50)  NOT NULL,
      url       VARCHAR(100) NULL,
      parent_id INT          NULL,
      ordem     INT          NOT NULL DEFAULT 0,
      perfil_id INT          NOT NULL,
      ativo     BIT          NOT NULL DEFAULT 1,
      CONSTRAINT FK_menus_perfis FOREIGN KEY (perfil_id) REFERENCES perfis(id),
      CONSTRAINT FK_menus_parent FOREIGN KEY (parent_id) REFERENCES menus(id)
    );
  `);

  // === Tabelas de Veículos ===

  await pool.request().query(`
    IF OBJECT_ID('marcas', 'U') IS NULL
    CREATE TABLE marcas (
      id    INT          IDENTITY(1,1) PRIMARY KEY,
      nome  VARCHAR(100) NOT NULL,
      ativo BIT          NOT NULL DEFAULT 1
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('modelos', 'U') IS NULL
    CREATE TABLE modelos (
      id       INT          IDENTITY(1,1) PRIMARY KEY,
      marca_id INT          NOT NULL,
      nome     VARCHAR(100) NOT NULL,
      ativo    BIT          NOT NULL DEFAULT 1,
      CONSTRAINT FK_modelos_marcas FOREIGN KEY (marca_id) REFERENCES marcas(id)
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('versoes', 'U') IS NULL
    CREATE TABLE versoes (
      id        INT          IDENTITY(1,1) PRIMARY KEY,
      modelo_id INT          NOT NULL,
      nome      VARCHAR(100) NOT NULL,
      ativo     BIT          NOT NULL DEFAULT 1,
      CONSTRAINT FK_versoes_modelos FOREIGN KEY (modelo_id) REFERENCES modelos(id)
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('cores', 'U') IS NULL
    CREATE TABLE cores (
      id    INT         IDENTITY(1,1) PRIMARY KEY,
      nome  VARCHAR(50) NOT NULL,
      ativo BIT         NOT NULL DEFAULT 1
    );
  `);

  await pool.request().query(`
    IF OBJECT_ID('veiculos', 'U') IS NULL
    BEGIN
      CREATE TABLE veiculos (
        id             INT          IDENTITY(1,1) PRIMARY KEY,
        marca_id       INT          NOT NULL,
        modelo_id      INT          NOT NULL,
        versao_id      INT          NULL,
        cor_id         INT          NOT NULL,
        placa          VARCHAR(10)  NOT NULL,
        ano_fabricacao INT          NULL,
        ano_modelo     INT          NULL,
        renavam        VARCHAR(11)  NULL,
        chassi         VARCHAR(17)  NULL,
        observacoes    TEXT         NULL,
        ativo          BIT          NOT NULL DEFAULT 1,
        criado_em      DATETIME     NOT NULL DEFAULT GETDATE(),
        atualizado_em  DATETIME     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_veiculos_placa   UNIQUE (placa),
        CONSTRAINT FK_veiculos_marcas  FOREIGN KEY (marca_id)  REFERENCES marcas(id),
        CONSTRAINT FK_veiculos_modelos FOREIGN KEY (modelo_id) REFERENCES modelos(id),
        CONSTRAINT FK_veiculos_versoes FOREIGN KEY (versao_id) REFERENCES versoes(id),
        CONSTRAINT FK_veiculos_cores   FOREIGN KEY (cor_id)    REFERENCES cores(id)
      );
      CREATE UNIQUE INDEX UQ_veiculos_renavam ON veiculos(renavam) WHERE renavam IS NOT NULL;
      CREATE UNIQUE INDEX UQ_veiculos_chassi  ON veiculos(chassi)  WHERE chassi  IS NOT NULL;
    END
  `);
}

// ------------------------------------------------
// Seed: admin padrão na primeira execução
// ------------------------------------------------
async function seedAdmin(pool) {
  const resultado = await pool.request()
    .input('email', sql.NVarChar, 'admin@admin.com')
    .query('SELECT id FROM usuarios WHERE email = @email');

  const perfil   = await pool.request().query('SELECT id FROM perfis WHERE nivel = 1');
  const perfilId = perfil.recordset[0]?.id || 1;

  if (resultado.recordset.length === 0) {
    const senhaHash = bcrypt.hashSync('admin123', 10);

    const ins = await pool.request()
      .input('nome',      sql.NVarChar, 'Administrador')
      .input('email',     sql.NVarChar, 'admin@admin.com')
      .input('senhaHash', sql.NVarChar, senhaHash)
      .query(`
        INSERT INTO usuarios (nome, email, senha_hash)
        OUTPUT INSERTED.id
        VALUES (@nome, @email, @senhaHash)
      `);

    const usuarioId = ins.recordset[0].id;
    await pool.request()
      .input('usuario_id', sql.Int, usuarioId)
      .input('perfil_id',  sql.Int, perfilId)
      .query('INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES (@usuario_id, @perfil_id)');

    console.log('Usuário admin criado — e-mail: admin@admin.com / senha: admin123');
  } else {
    // Garante que admin existente tem entrada em usuario_perfis (após migração)
    const adminId   = resultado.recordset[0].id;
    const semPerfil = await pool.request()
      .input('id', sql.Int, adminId)
      .query('SELECT 1 AS tem FROM usuario_perfis WHERE usuario_id = @id');

    if (semPerfil.recordset.length === 0) {
      await pool.request()
        .input('usuario_id', sql.Int, adminId)
        .input('perfil_id',  sql.Int, perfilId)
        .query('INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES (@usuario_id, @perfil_id)');
    }
  }
}

// ------------------------------------------------
// Seed: menus padrão (executa toda inicialização,
//       mas só insere itens que ainda não existem)
// ------------------------------------------------
async function upsertMenu(pool, { label, icon, url, parent_id, ordem, perfil_id }) {
  let check;
  if (url) {
    check = await pool.request()
      .input('url', sql.VarChar, url)
      .query('SELECT id FROM menus WHERE url = @url');
  } else {
    check = await pool.request()
      .input('label',     sql.VarChar, label)
      .input('parent_id', sql.Int,     parent_id || null)
      .query(`
        SELECT id FROM menus
        WHERE label = @label AND url IS NULL
          AND ((@parent_id IS NULL AND parent_id IS NULL) OR parent_id = @parent_id)
      `);
  }

  if (check.recordset.length > 0) return check.recordset[0].id;

  const ins = await pool.request()
    .input('label',     sql.VarChar, label)
    .input('icon',      sql.VarChar, icon)
    .input('url',       sql.VarChar, url || null)
    .input('parent_id', sql.Int,     parent_id || null)
    .input('ordem',     sql.Int,     ordem || 0)
    .input('perfil_id', sql.Int,     perfil_id)
    .query(`
      INSERT INTO menus (label, icon, url, parent_id, ordem, perfil_id, ativo)
      OUTPUT INSERTED.id
      VALUES (@label, @icon, @url, @parent_id, @ordem, @perfil_id, 1)
    `);
  return ins.recordset[0].id;
}

async function seedMenus(pool) {
  const resPerfis = await pool.request().query('SELECT id, nivel FROM perfis ORDER BY nivel ASC');
  const pAdmin   = resPerfis.recordset.find(p => p.nivel === 1)?.id;
  const pUsuario = resPerfis.recordset.find(p => p.nivel === 2)?.id;
  if (!pAdmin || !pUsuario) return;

  await upsertMenu(pool, { label: 'Dashboard',            icon: 'dashboard',  url: 'dashboard', parent_id: null, ordem: 1,  perfil_id: pUsuario });
  await upsertMenu(pool, { label: 'Cadastro de Clientes', icon: 'clientes',   url: 'clientes',  parent_id: null, ordem: 2,  perfil_id: pUsuario });
  await upsertMenu(pool, { label: 'Veículos',             icon: 'veiculos',   url: 'veiculos',  parent_id: null, ordem: 3,  perfil_id: pUsuario });

  const bkId = await upsertMenu(pool, { label: 'Backoffice', icon: 'backoffice', url: null, parent_id: null, ordem: 10, perfil_id: pAdmin });

  await upsertMenu(pool, { label: 'Usuários',         icon: 'usuarios',      url: 'usuarios',      parent_id: bkId, ordem: 1, perfil_id: pAdmin });
  await upsertMenu(pool, { label: 'Menus',            icon: 'menus',          url: 'menus',         parent_id: bkId, ordem: 2, perfil_id: pAdmin });
  await upsertMenu(pool, { label: 'Perfis',           icon: 'perfis',         url: 'perfis',        parent_id: bkId, ordem: 3, perfil_id: pAdmin });
  await upsertMenu(pool, { label: 'Tipos de Contato', icon: 'tipos-contato',  url: 'tipos-contato', parent_id: bkId, ordem: 4, perfil_id: pAdmin });

  const tabId = await upsertMenu(pool, { label: 'Tabelas Auxiliares', icon: 'tabelas-aux', url: null, parent_id: bkId, ordem: 5, perfil_id: pAdmin });

  await upsertMenu(pool, { label: 'Marcas',  icon: 'marcas',  url: 'marcas',  parent_id: tabId, ordem: 1, perfil_id: pAdmin });
  await upsertMenu(pool, { label: 'Modelos', icon: 'modelos', url: 'modelos', parent_id: tabId, ordem: 2, perfil_id: pAdmin });
  await upsertMenu(pool, { label: 'Versões', icon: 'versoes', url: 'versoes', parent_id: tabId, ordem: 3, perfil_id: pAdmin });
  await upsertMenu(pool, { label: 'Cores',   icon: 'cores',   url: 'cores',   parent_id: tabId, ordem: 4, perfil_id: pAdmin });
}

module.exports = { poolPromise, sql };
