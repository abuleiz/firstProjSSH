import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function MarcasList() {
  const [marcas, setMarcas] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const res = await api.get('/marcas/todas');
      setMarcas(res.data);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao carregar marcas', 'erro');
    }
  }

  async function toggle(m) {
    const acao = m.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} a marca "${m.nome}"?`)) return;
    try {
      await api.patch(`/marcas/${m.id}/toggle`);
      mostrar(`Marca ${m.ativo ? 'desativada' : 'ativada'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao alterar status', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Marcas</h2>
        <button onClick={() => navigate('/marcas/novo')}>+ Nova Marca</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Modelos Ativos</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {marcas.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhuma marca cadastrada</td></tr>
          ) : marcas.map(m => (
            <tr key={m.id}>
              <td data-label="Nome">{m.nome}</td>
              <td data-label="Modelos Ativos">{m.modelos_ativos}</td>
              <td data-label="Status">
                <span className={`badge-status ${m.ativo ? 'ativo' : 'inativo'}`}>
                  {m.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/marcas/${m.id}/editar`)}>Editar</button>
                {m.ativo
                  ? <button className="btn-deletar" onClick={() => toggle(m)}>Desativar</button>
                  : <button className="btn-ativar"  onClick={() => toggle(m)}>Ativar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
