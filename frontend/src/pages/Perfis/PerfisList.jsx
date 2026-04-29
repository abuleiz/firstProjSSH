import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function PerfisList() {
  const [perfis, setPerfis] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const res = await api.get('/perfis/todos');
    setPerfis(res.data);
  }

  async function toggleStatus(p) {
    const acao = p.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} este perfil?`)) return;
    try {
      await api.patch(`/perfis/${p.id}/status`);
      mostrar(`Perfil ${p.ativo ? 'desativado' : 'ativado'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Perfis</h2>
        <button onClick={() => navigate('/perfis/novo')}>+ Novo Perfil</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Status</th>
            <th>Usuários Ativos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {perfis.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhum perfil</td></tr>
          ) : perfis.map(p => {
            const protegido = p.nivel === 1;
            return (
              <tr key={p.id}>
                <td data-label="Nome">{p.nome}</td>
                <td data-label="Descrição">{p.descricao || '—'}</td>
                <td data-label="Status"><span className={`badge-status ${p.ativo ? 'ativo' : 'inativo'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td data-label="Usuários Ativos">{p.usuarios_ativos}</td>
                <td className="td-acoes">
                  <button className="btn-editar" onClick={() => navigate(`/perfis/${p.id}/editar`)} disabled={protegido}>Editar</button>
                  {p.ativo
                    ? <button className="btn-deletar" onClick={() => toggleStatus(p)} disabled={protegido}>Desativar</button>
                    : <button className="btn-ativar" onClick={() => toggleStatus(p)}>Ativar</button>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
