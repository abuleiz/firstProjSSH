import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function CoresList() {
  const [cores, setCores] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const res = await api.get('/cores/todas');
      setCores(res.data);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao carregar cores', 'erro');
    }
  }

  async function toggle(c) {
    const acao = c.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} a cor "${c.nome}"?`)) return;
    try {
      await api.patch(`/cores/${c.id}/toggle`);
      mostrar(`Cor ${c.ativo ? 'desativada' : 'ativada'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao alterar status', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Cores</h2>
        <button onClick={() => navigate('/cores/novo')}>+ Nova Cor</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Veículos Ativos</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {cores.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhuma cor cadastrada</td></tr>
          ) : cores.map(c => (
            <tr key={c.id}>
              <td data-label="Nome">{c.nome}</td>
              <td data-label="Veículos Ativos">{c.veiculos_ativos}</td>
              <td data-label="Status">
                <span className={`badge-status ${c.ativo ? 'ativo' : 'inativo'}`}>
                  {c.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/cores/${c.id}/editar`)}>Editar</button>
                {c.ativo
                  ? <button className="btn-deletar" onClick={() => toggle(c)}>Desativar</button>
                  : <button className="btn-ativar"  onClick={() => toggle(c)}>Ativar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
