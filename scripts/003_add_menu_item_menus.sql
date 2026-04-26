-- Adiciona o item "Menus" dentro do submenu Backoffice
INSERT INTO menus (label, icon, url, parent_id, ordem, perfil)
SELECT 'Menus', 'menus', 'menus', id, 2, 'admin'
FROM menus WHERE icon = 'backoffice';
