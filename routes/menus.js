const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Sidebar: itens ativos filtrados pelo perfil do usuário (hierárquico por nivel)
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('perfil_id', sql.Int, req.session.perfil_id)
      .query(`
        SELECT m.id, m.label, m.icon, m.url, m.parent_id, m.ordem,
               pm.nivel AS perfil_nivel
        FROM menus m
        JOIN perfis pm ON m.perfil_id = pm.id
        JOIN perfis pu ON pu.id = @perfil_id
        WHERE m.ativo = 1
          AND pm.nivel >= pu.nivel
        ORDER BY ISNULL(m.parent_id, 0), m.ordem
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar menu' });
  }
});

// Menus raiz para o select de Menu Pai no formulário (deve vir antes de /:id)
router.get('/raiz', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT id, label FROM menus WHERE parent_id IS NULL ORDER BY ordem');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar menus raiz' });
  }
});

// Todos os menus para a tela de gerenciamento (deve vir antes de /:id)
router.get('/todos', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT m.id, m.label, m.icon, m.url, m.parent_id, m.ordem, m.ativo,
               m.perfil_id, pm.nome AS perfil_nome, pm.nivel AS perfil_nivel,
               p.label AS pai_label
        FROM menus m
        JOIN perfis pm ON m.perfil_id = pm.id
        LEFT JOIN menus p ON m.parent_id = p.id
        ORDER BY ISNULL(m.parent_id, 0), m.ordem
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar menus' });
  }
});

// Busca menu por id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const pool   = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT m.id, m.label, m.icon, m.url, m.parent_id, m.ordem, m.ativo,
               m.perfil_id, pm.nome AS perfil_nome, pm.nivel AS perfil_nivel
        FROM menus m
        JOIN perfis pm ON m.perfil_id = pm.id
        WHERE m.id = @id
      `);
    const menu = result.recordset[0];
    if (!menu) return res.status(404).json({ erro: 'Menu não encontrado' });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar menu' });
  }
});

// Cria novo menu
router.post('/', requireAdmin, async (req, res) => {
  const { label, icon, url, parent_id, ordem, perfil_id, ativo } = req.body;

  if (!label || !icon) return res.status(400).json({ erro: 'Label e ícone são obrigatórios' });

  try {
    const pool   = await poolPromise;

    const resPerfil = await pool.request()
      .input('perfil_id', sql.Int, perfil_id)
      .query('SELECT id FROM perfis WHERE id = @perfil_id AND ativo = 1');
    if (!resPerfil.recordset[0]) return res.status(400).json({ erro: 'Perfil inválido' });

    const result = await pool.request()
      .input('label',     sql.VarChar, label)
      .input('icon',      sql.VarChar, icon)
      .input('url',       sql.VarChar, url       || null)
      .input('parent_id', sql.Int,     parent_id || null)
      .input('ordem',     sql.Int,     ordem     || 0)
      .input('perfil_id', sql.Int,     perfil_id)
      .input('ativo',     sql.Bit,     ativo ? 1 : 0)
      .query(`
        INSERT INTO menus (label, icon, url, parent_id, ordem, perfil_id, ativo)
        OUTPUT INSERTED.id
        VALUES (@label, @icon, @url, @parent_id, @ordem, @perfil_id, @ativo)
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar menu' });
  }
});

// Atualiza menu existente
router.put('/:id', requireAdmin, async (req, res) => {
  const { label, icon, url, parent_id, ordem, perfil_id, ativo } = req.body;

  if (!label || !icon) return res.status(400).json({ erro: 'Label e ícone são obrigatórios' });

  try {
    const pool = await poolPromise;

    const resPerfil = await pool.request()
      .input('perfil_id', sql.Int, perfil_id)
      .query('SELECT id FROM perfis WHERE id = @perfil_id AND ativo = 1');
    if (!resPerfil.recordset[0]) return res.status(400).json({ erro: 'Perfil inválido' });

    const result = await pool.request()
      .input('id',        sql.Int,     req.params.id)
      .input('label',     sql.VarChar, label)
      .input('icon',      sql.VarChar, icon)
      .input('url',       sql.VarChar, url       || null)
      .input('parent_id', sql.Int,     parent_id || null)
      .input('ordem',     sql.Int,     ordem     || 0)
      .input('perfil_id', sql.Int,     perfil_id)
      .input('ativo',     sql.Bit,     ativo ? 1 : 0)
      .query(`
        UPDATE menus
        SET label=@label, icon=@icon, url=@url,
            parent_id=@parent_id, ordem=@ordem, perfil_id=@perfil_id, ativo=@ativo
        WHERE id=@id
      `);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ erro: 'Menu não encontrado' });
    res.json({ id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar menu' });
  }
});

// Alterna ativo/inativo (sem excluir)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const pool    = await poolPromise;
    const resMenu = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo, url FROM menus WHERE id = @id');

    const menu = resMenu.recordset[0];
    if (!menu) return res.status(404).json({ erro: 'Menu não encontrado' });
    if (menu.url === 'menus') return res.status(400).json({ erro: 'Este item não pode ser desativado' });

    const novoStatus = menu.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE menus SET ativo=@ativo WHERE id=@id');

    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do menu' });
  }
});

module.exports = router;
