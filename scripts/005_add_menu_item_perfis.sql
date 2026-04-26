-- Adiciona o item "Perfis" dentro do submenu Backoffice (ordem 3)
INSERT INTO menus (label, icon, url, parent_id, ordem, perfil_id)
SELECT 'Perfis', 'perfis', 'perfis', id, 3, 1
FROM menus WHERE icon = 'backoffice';
