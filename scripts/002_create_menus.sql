-- Tabela de menus dinâmicos
CREATE TABLE menus (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  label     VARCHAR(100) NOT NULL,
  icon      VARCHAR(50)  NOT NULL,
  url       VARCHAR(200) NULL,
  parent_id INT          NULL REFERENCES menus(id),
  ordem     INT          NOT NULL DEFAULT 0,
  perfil    VARCHAR(20)  NOT NULL DEFAULT 'todos',
  ativo     BIT          NOT NULL DEFAULT 1
);

-- Itens raiz
INSERT INTO menus (label, icon, url, parent_id, ordem, perfil) VALUES
  ('Dashboard',            'dashboard',  'dashboard', NULL, 1, 'todos'),
  ('Cadastro de Clientes', 'clientes',   'clientes',  NULL, 2, 'todos'),
  ('Backoffice',           'backoffice', NULL,        NULL, 3, 'admin');

-- Filhos do Backoffice (referencia o id recém-inserido)
INSERT INTO menus (label, icon, url, parent_id, ordem, perfil)
SELECT 'Usuários', 'usuarios', 'usuarios', id, 1, 'admin'
FROM menus WHERE icon = 'backoffice';
