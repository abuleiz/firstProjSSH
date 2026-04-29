import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useMensagem } from '../../components/Mensagem';

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const { usuario: eu } = useAuth();
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const res = await api.get('/usuarios');
    setUsuarios(res.data);
  }

  async function toggleStatus(u) {
    const acao = u.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} este usuário?`)) return;
    try {
      await api.patch(`/usuarios/${u.id}/status`);
      mostrar(`Usuário ${u.ativo ? 'desativado' : 'ativado'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Usuários</h2>
        <button onClick={() => navigate('/usuarios/novo')}>+ Novo Usuário</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfis</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhum usuário</td></tr>
          ) : usuarios.map(u => (
            <tr key={u.id}>
              <td data-label="Nome">{u.nome}</td>
              <td data-label="E-mail">{u.email}</td>
              <td data-label="Perfis">
                <span className={`badge-nivel ${u.perfil_nivel === 1 ? 'admin' : 'usuario'}`}>
                  {u.perfis_nomes || '—'}
                </span>
              </td>
              <td data-label="Status">
                <span className={`badge-status ${u.ativo ? 'ativo' : 'inativo'}`}>
                  {u.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/usuarios/${u.id}/editar`)}>Editar</button>
                {u.ativo
                  ? <button className="btn-deletar" onClick={() => toggleStatus(u)} disabled={u.id === eu?.id} title={u.id === eu?.id ? 'Você não pode desativar sua própria conta' : ''}>Desativar</button>
                  : <button className="btn-ativar" onClick={() => toggleStatus(u)}>Ativar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
