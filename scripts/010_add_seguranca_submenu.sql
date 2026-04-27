-- Cria o item "Segurança" como filho do Backoffice
IF NOT EXISTS (SELECT 1 FROM menus WHERE icon = 'seguranca')
BEGIN
  DECLARE @bo_id INT;
  SELECT @bo_id = id FROM menus WHERE icon = 'backoffice';

  INSERT INTO menus (label, icon, url, parent_id, ordem, perfil_id, ativo)
  VALUES ('Segurança', 'seguranca', NULL, @bo_id, 1, 1, 1);

  DECLARE @seg_id INT = SCOPE_IDENTITY();

  -- Move Usuários e Perfis para dentro de Segurança
  UPDATE menus SET parent_id = @seg_id, ordem = 1 WHERE icon = 'usuarios';
  UPDATE menus SET parent_id = @seg_id, ordem = 2 WHERE icon = 'perfis';

  -- Ajusta a ordem dos itens que permanecem diretamente no Backoffice
  UPDATE menus SET ordem = 2 WHERE icon = 'menus'         AND parent_id = @bo_id;
  UPDATE menus SET ordem = 3 WHERE icon = 'tipos-contato' AND parent_id = @bo_id;
END
