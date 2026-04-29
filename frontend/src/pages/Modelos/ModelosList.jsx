import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function ModelosList() {
  const [modelos, setModelos] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const res = await api.get('/modelos/todos');
      setModelos(res.data);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao carregar modelos', 'erro');
    }
  }

  async function toggle(m) {
    const acao = m.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} o modelo "${m.nome}"?`)) return;
    try {
      await api.patch(`/modelos/${m.id}/toggle`);
      mostrar(`Modelo ${m.ativo ? 'desativado' : 'ativado'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao alterar status', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Modelos</h2>
        <button onClick={() => navigate('/modelos/novo')}>+ Novo Modelo</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Versões Ativas</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {modelos.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhum modelo cadastrado</td></tr>
          ) : modelos.map(m => (
            <tr key={m.id}>
              <td data-label="Marca">{m.marca_nome}</td>
              <td data-label="Modelo">{m.nome}</td>
              <td data-label="Versões Ativas">{m.versoes_ativas}</td>
              <td data-label="Status">
                <span className={`badge-status ${m.ativo ? 'ativo' : 'inativo'}`}>
                  {m.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/modelos/${m.id}/editar`)}>Editar</button>
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
