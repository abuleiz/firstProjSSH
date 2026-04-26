-- ================================================
-- 004: Sistema de perfis dinâmico
-- ================================================

-- 1. Criar tabela perfis
CREATE TABLE perfis (
  id        INT          IDENTITY(1,1) PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  descricao VARCHAR(255) NULL,
  ativo     BIT          NOT NULL DEFAULT 1,
  nivel     INT          NOT NULL DEFAULT 0
);

-- 2. Inserir perfis iniciais
INSERT INTO perfis (nome, descricao, ativo, nivel) VALUES
  ('Administrador', 'Acesso total ao sistema',  1, 1),
  ('Usuário',       'Acesso padrão ao sistema', 1, 2);

-- 3. Migrar tabela menus: substituir perfil VARCHAR por perfil_id INT FK
ALTER TABLE menus ADD perfil_id INT NULL;

UPDATE menus SET perfil_id = 1 WHERE perfil = 'admin';
UPDATE menus SET perfil_id = 2 WHERE perfil = 'todos';

ALTER TABLE menus ALTER COLUMN perfil_id INT NOT NULL;
ALTER TABLE menus ADD CONSTRAINT FK_menus_perfis FOREIGN KEY (perfil_id) REFERENCES perfis(id);
ALTER TABLE menus DROP COLUMN perfil;

-- 4. Migrar tabela usuarios: substituir nivel VARCHAR por perfil_id INT FK
ALTER TABLE usuarios ADD perfil_id INT NULL;

UPDATE usuarios SET perfil_id = 1 WHERE nivel = 'admin';
UPDATE usuarios SET perfil_id = 2 WHERE nivel = 'usuario';

ALTER TABLE usuarios ALTER COLUMN perfil_id INT NOT NULL;
ALTER TABLE usuarios ADD CONSTRAINT FK_usuarios_perfis FOREIGN KEY (perfil_id) REFERENCES perfis(id);

-- 5. Remover constraint CHECK e coluna nivel de usuarios
DECLARE @constraint_name NVARCHAR(200);
SELECT @constraint_name = c.name
FROM sys.check_constraints c
WHERE c.parent_object_id = OBJECT_ID('usuarios')
  AND c.definition LIKE '%nivel%';

IF @constraint_name IS NOT NULL
  EXEC('ALTER TABLE usuarios DROP CONSTRAINT ' + @constraint_name);

ALTER TABLE usuarios DROP COLUMN nivel;
