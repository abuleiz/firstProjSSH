import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function MenusList() {
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const res = await api.get('/menus/todos');
    setMenus(res.data);
  }

  async function toggleStatus(m) {
    if (m.url === 'menus') { mostrar('Este item não pode ser desativado', 'erro'); return; }
    const acao = m.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} este menu?`)) return;
    try {
      await api.patch(`/menus/${m.id}/status`);
      mostrar(`Menu ${m.ativo ? 'desativado' : 'ativado'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Menus</h2>
        <button onClick={() => navigate('/menus/novo')}>+ Novo Menu</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ordem</th>
            <th>Label</th>
            <th>URL</th>
            <th>Menu Pai</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {menus.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhum menu</td></tr>
          ) : menus.map(m => (
            <tr key={m.id}>
              <td data-label="Ordem">{m.ordem}</td>
              <td data-label="Label">{m.label}</td>
              <td data-label="URL">{m.url || '—'}</td>
              <td data-label="Menu Pai">{m.pai_label || '—'}</td>
              <td data-label="Perfil"><span className={`badge-nivel ${m.perfil_nivel === 1 ? 'admin' : 'usuario'}`}>{m.perfil_nome}</span></td>
              <td data-label="Status"><span className={`badge-status ${m.ativo ? 'ativo' : 'inativo'}`}>{m.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/menus/${m.id}/editar`)}>Editar</button>
                {m.ativo
                  ? <button className="btn-deletar" onClick={() => toggleStatus(m)} disabled={m.url === 'menus'}>Desativar</button>
                  : <button className="btn-ativar" onClick={() => toggleStatus(m)}>Ativar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
