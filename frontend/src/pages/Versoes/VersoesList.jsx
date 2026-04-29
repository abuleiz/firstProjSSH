import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function VersoesList() {
  const [versoes, setVersoes] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const res = await api.get('/versoes/todas');
      setVersoes(res.data);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao carregar versões', 'erro');
    }
  }

  async function toggle(v) {
    const acao = v.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} a versão "${v.nome}"?`)) return;
    try {
      await api.patch(`/versoes/${v.id}/toggle`);
      mostrar(`Versão ${v.ativo ? 'desativada' : 'ativada'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao alterar status', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Versões</h2>
        <button onClick={() => navigate('/versoes/novo')}>+ Nova Versão</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Versão</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {versoes.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhuma versão cadastrada</td></tr>
          ) : versoes.map(v => (
            <tr key={v.id}>
              <td data-label="Marca">{v.marca_nome}</td>
              <td data-label="Modelo">{v.modelo_nome}</td>
              <td data-label="Versão">{v.nome}</td>
              <td data-label="Status">
                <span className={`badge-status ${v.ativo ? 'ativo' : 'inativo'}`}>
                  {v.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/versoes/${v.id}/editar`)}>Editar</button>
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
