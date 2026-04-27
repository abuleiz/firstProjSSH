-- Cria tabela de perfis por usuário (relação N:N)
IF OBJECT_ID('usuario_perfis', 'U') IS NULL
BEGIN
  CREATE TABLE usuario_perfis (
    usuario_id INT NOT NULL,
    perfil_id  INT NOT NULL,
    CONSTRAINT PK_usuario_perfis PRIMARY KEY (usuario_id, perfil_id),
    CONSTRAINT FK_up_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT FK_up_perfil  FOREIGN KEY (perfil_id)  REFERENCES perfis(id)
  );

  -- Migra perfil_id existente para a nova tabela
  INSERT INTO usuario_perfis (usuario_id, perfil_id)
  SELECT id, perfil_id FROM usuarios WHERE perfil_id IS NOT NULL;
END

-- Remove coluna perfil_id de usuarios (após migração)
IF COL_LENGTH('usuarios', 'perfil_id') IS NOT NULL
BEGIN
  DECLARE @fk NVARCHAR(256);
  SELECT @fk = name FROM sys.foreign_keys
  WHERE parent_object_id = OBJECT_ID('usuarios')
    AND name LIKE 'FK_usuarios_perfis%';
  IF @fk IS NOT NULL
    EXEC('ALTER TABLE usuarios DROP CONSTRAINT ' + @fk);

  ALTER TABLE usuarios DROP COLUMN perfil_id;
END
