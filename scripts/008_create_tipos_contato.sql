-- Cria tabela tipos_contato com dados iniciais
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

-- Adiciona coluna tipo_id em contatos e migra dados
IF COL_LENGTH('contatos', 'tipo_id') IS NULL
BEGIN
  ALTER TABLE contatos ADD tipo_id INT NULL;

  ALTER TABLE contatos ADD CONSTRAINT FK_contatos_tipos
    FOREIGN KEY (tipo_id) REFERENCES tipos_contato(id);

  -- Mapeia os valores antigos para os novos ids
  -- 'celular'/'trabalho'/'residencial' → LOWER(tc.nome) coincide
  -- 'email' → 'E-mail' precisa de tratamento especial
  UPDATE c SET c.tipo_id = tc.id
  FROM contatos c
  JOIN tipos_contato tc ON (
    LOWER(tc.nome) = c.tipo
    OR (c.tipo = 'email' AND tc.nome = 'E-mail')
  );

  ALTER TABLE contatos ALTER COLUMN tipo_id INT NOT NULL;
END

-- Remove coluna tipo antiga (drop CHECK constraint antes)
IF COL_LENGTH('contatos', 'tipo') IS NOT NULL
BEGIN
  DECLARE @ck NVARCHAR(256);
  SELECT TOP 1 @ck = name FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID('contatos')
    AND definition LIKE '%tipo%';

  IF @ck IS NOT NULL
    EXEC('ALTER TABLE contatos DROP CONSTRAINT [' + @ck + ']');

  ALTER TABLE contatos DROP COLUMN tipo;
END
