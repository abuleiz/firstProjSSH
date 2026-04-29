const express = require('express');
const router  = express.Router();
const { poolPromise, sql } = require('../src/config/database');
const { requireAuth } = require('../middleware/auth');

const SELECT_LISTA = `
  SELECT v.id, v.placa, v.ano_fabricacao, v.ano_modelo, v.ativo,
         m.nome  AS marca_nome,
         mo.nome AS modelo_nome,
         ve.nome AS versao_nome,
         c.nome  AS cor_nome
  FROM veiculos v
  JOIN marcas  m  ON m.id  = v.marca_id
  JOIN modelos mo ON mo.id = v.modelo_id
  LEFT JOIN versoes ve ON ve.id = v.versao_id
  JOIN cores   c  ON c.id  = v.cor_id
`;

// Lista todos os veículos
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`${SELECT_LISTA} ORDER BY v.placa`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar veículos' });
  }
});

// Busca veículo por id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT v.*,
               m.nome  AS marca_nome,
               mo.nome AS modelo_nome,
               ve.nome AS versao_nome,
               c.nome  AS cor_nome
        FROM veiculos v
        JOIN marcas  m  ON m.id  = v.marca_id
        JOIN modelos mo ON mo.id = v.modelo_id
        LEFT JOIN versoes ve ON ve.id = v.versao_id
        JOIN cores   c  ON c.id  = v.cor_id
        WHERE v.id = @id
      `);
    const veiculo = result.recordset[0];
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado' });
    res.json(veiculo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar veículo' });
  }
});

// Cria novo veículo
router.post('/', requireAuth, async (req, res) => {
  const { marca_id, modelo_id, versao_id, cor_id, placa,
          ano_fabricacao, ano_modelo, renavam, chassi, observacoes } = req.body;

  if (!marca_id || !modelo_id || !cor_id || !placa?.trim())
    return res.status(400).json({ erro: 'Marca, Modelo, Cor e Placa são obrigatórios' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('marca_id',      sql.Int,     Number(marca_id))
      .input('modelo_id',     sql.Int,     Number(modelo_id))
      .input('versao_id',     sql.Int,     versao_id ? Number(versao_id) : null)
      .input('cor_id',        sql.Int,     Number(cor_id))
      .input('placa',         sql.VarChar, placa.trim().toUpperCase())
      .input('ano_fabricacao', sql.Int,    ano_fabricacao ? Number(ano_fabricacao) : null)
      .input('ano_modelo',    sql.Int,     ano_modelo ? Number(ano_modelo) : null)
      .input('renavam',       sql.VarChar, renavam?.trim() || null)
      .input('chassi',        sql.VarChar, chassi?.trim().toUpperCase() || null)
      .input('observacoes',   sql.NVarChar, observacoes?.trim() || null)
      .query(`
        INSERT INTO veiculos
          (marca_id, modelo_id, versao_id, cor_id, placa, ano_fabricacao, ano_modelo,
           renavam, chassi, observacoes)
        OUTPUT INSERTED.id
        VALUES
          (@marca_id, @modelo_id, @versao_id, @cor_id, @placa, @ano_fabricacao, @ano_modelo,
           @renavam, @chassi, @observacoes)
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      if (err.message?.includes('UQ_veiculos_placa'))
        return res.status(400).json({ erro: 'Placa já cadastrada' });
      if (err.message?.includes('UQ_veiculos_renavam'))
        return res.status(400).json({ erro: 'RENAVAM já cadastrado' });
      if (err.message?.includes('UQ_veiculos_chassi'))
        return res.status(400).json({ erro: 'Chassi já cadastrado' });
      return res.status(400).json({ erro: 'Dado duplicado' });
    }
    res.status(500).json({ erro: 'Erro ao salvar veículo' });
  }
});

// Atualiza veículo
router.put('/:id', requireAuth, async (req, res) => {
  const { marca_id, modelo_id, versao_id, cor_id, placa,
          ano_fabricacao, ano_modelo, renavam, chassi, observacoes } = req.body;

  if (!marca_id || !modelo_id || !cor_id || !placa?.trim())
    return res.status(400).json({ erro: 'Marca, Modelo, Cor e Placa são obrigatórios' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id',            sql.Int,     req.params.id)
      .input('marca_id',      sql.Int,     Number(marca_id))
      .input('modelo_id',     sql.Int,     Number(modelo_id))
      .input('versao_id',     sql.Int,     versao_id ? Number(versao_id) : null)
      .input('cor_id',        sql.Int,     Number(cor_id))
      .input('placa',         sql.VarChar, placa.trim().toUpperCase())
      .input('ano_fabricacao', sql.Int,    ano_fabricacao ? Number(ano_fabricacao) : null)
      .input('ano_modelo',    sql.Int,     ano_modelo ? Number(ano_modelo) : null)
      .input('renavam',       sql.VarChar, renavam?.trim() || null)
      .input('chassi',        sql.VarChar, chassi?.trim().toUpperCase() || null)
      .input('observacoes',   sql.NVarChar, observacoes?.trim() || null)
      .query(`
        UPDATE veiculos
        SET marca_id=@marca_id, modelo_id=@modelo_id, versao_id=@versao_id,
            cor_id=@cor_id, placa=@placa, ano_fabricacao=@ano_fabricacao,
            ano_modelo=@ano_modelo, renavam=@renavam, chassi=@chassi,
            observacoes=@observacoes, atualizado_em=GETDATE()
        WHERE id=@id
      `);
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    res.json({ id: Number(req.params.id) });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      if (err.message?.includes('UQ_veiculos_placa'))
        return res.status(400).json({ erro: 'Placa já cadastrada' });
      if (err.message?.includes('UQ_veiculos_renavam'))
        return res.status(400).json({ erro: 'RENAVAM já cadastrado' });
      if (err.message?.includes('UQ_veiculos_chassi'))
        return res.status(400).json({ erro: 'Chassi já cadastrado' });
      return res.status(400).json({ erro: 'Dado duplicado' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar veículo' });
  }
});

// Alterna ativo/inativo
router.patch('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const resVeiculo = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT ativo FROM veiculos WHERE id = @id');
    const veiculo = resVeiculo.recordset[0];
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado' });

    const novoStatus = veiculo.ativo ? 0 : 1;
    await pool.request()
      .input('ativo', sql.Bit, novoStatus)
      .input('id',    sql.Int, req.params.id)
      .query('UPDATE veiculos SET ativo=@ativo, atualizado_em=GETDATE() WHERE id=@id');
    res.json({ ativo: novoStatus === 1 });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar status do veículo' });
  }
});

module.exports = router;
