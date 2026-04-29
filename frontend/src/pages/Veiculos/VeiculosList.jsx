import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function VeiculosList() {
  const [veiculos, setVeiculos] = useState([]);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const res = await api.get('/veiculos');
      setVeiculos(res.data);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao carregar veículos', 'erro');
    }
  }

  async function toggle(v) {
    const acao = v.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} o veículo de placa "${v.placa}"?`)) return;
    try {
      await api.patch(`/veiculos/${v.id}/toggle`);
      mostrar(`Veículo ${v.ativo ? 'desativado' : 'ativado'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao alterar status', 'erro');
    }
  }

  const filtrados = veiculos.filter(v =>
    v.placa.toLowerCase().includes(busca.toLowerCase()) ||
    v.modelo_nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Veículos</h2>
        <button onClick={() => navigate('/veiculos/novo')}>+ Novo Veículo</button>
      </div>

      <div className="barra-busca">
        <input
          type="text"
          placeholder="Buscar por placa ou modelo..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Versão</th>
            <th>Cor</th>
            <th>Ano</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>
                {busca ? 'Nenhum veículo encontrado para esta busca' : 'Nenhum veículo cadastrado'}
              </td>
            </tr>
          ) : filtrados.map(v => (
            <tr key={v.id}>
              <td data-label="Placa"><strong>{v.placa}</strong></td>
              <td data-label="Marca">{v.marca_nome}</td>
              <td data-label="Modelo">{v.modelo_nome}</td>
              <td data-label="Versão">{v.versao_nome || '—'}</td>
              <td data-label="Cor">{v.cor_nome}</td>
              <td data-label="Ano">
                {v.ano_fabricacao
                  ? v.ano_modelo && v.ano_modelo !== v.ano_fabricacao
                    ? `${v.ano_fabricacao}/${v.ano_modelo}`
                    : `${v.ano_fabricacao}`
                  : '—'}
              </td>
              <td data-label="Status">
                <span className={`badge-status ${v.ativo ? 'ativo' : 'inativo'}`}>
                  {v.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/veiculos/${v.id}/editar`)}>Editar</button>
                {v.ativo
                  ? <button className="btn-deletar" onClick={() => toggle(v)}>Desativar</button>
                  : <button className="btn-ativar"  onClick={() => toggle(v)}>Ativar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
