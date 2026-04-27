-- Adiciona o item "Tipos de Contato" dentro do submenu Backoffice (ordem 4)
INSERT INTO menus (label, icon, url, parent_id, ordem, perfil_id)
SELECT 'Tipos de Contato', 'tipos-contato', 'tipos-contato', id, 4, 1
FROM menus WHERE icon = 'backoffice';
