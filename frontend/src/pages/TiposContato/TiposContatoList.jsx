import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

const VALIDACAO_LABELS = { telefone: 'Telefone', email: 'E-mail', texto: 'Texto' };

export default function TiposContatoList() {
  const [tipos, setTipos] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const res = await api.get('/tipos-contato/todos');
    setTipos(res.data);
  }

  async function toggleStatus(t) {
    const acao = t.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} este tipo?`)) return;
    try {
      await api.patch(`/tipos-contato/${t.id}/status`);
      mostrar(`Tipo ${t.ativo ? 'desativado' : 'ativado'}!`, 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Tipos de Contato</h2>
        <button onClick={() => navigate('/tipos-contato/novo')}>+ Novo Tipo</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Máscara</th>
            <th>Placeholder</th>
            <th>Validação</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tipos.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhum tipo</td></tr>
          ) : tipos.map(t => (
            <tr key={t.id}>
              <td data-label="Nome">{t.nome}</td>
              <td data-label="Máscara">{t.mascara || '—'}</td>
              <td data-label="Placeholder">{t.placeholder || '—'}</td>
              <td data-label="Validação">{VALIDACAO_LABELS[t.validacao] || t.validacao}</td>
              <td data-label="Status"><span className={`badge-status ${t.ativo ? 'ativo' : 'inativo'}`}>{t.ativo ? 'Ativo' : 'Inativo'}</span></td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/tipos-contato/${t.id}/editar`)}>Editar</button>
                {t.ativo
                  ? <button className="btn-deletar" onClick={() => toggleStatus(t)}>Desativar</button>
                  : <button className="btn-ativar" onClick={() => toggleStatus(t)}>Ativar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
