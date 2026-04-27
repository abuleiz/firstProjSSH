-- Amplia o campo telefone de contatos para suportar e-mails
IF COL_LENGTH('contatos', 'telefone') IS NOT NULL
  ALTER TABLE contatos ALTER COLUMN telefone NVARCHAR(255) NOT NULL;
