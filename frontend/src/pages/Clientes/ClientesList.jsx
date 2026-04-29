import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatarCPF } from '../../utils/formatacao';
import { useMensagem } from '../../components/Mensagem';

export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const navigate = useNavigate();
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const res = await api.get('/clientes');
    setClientes(res.data);
  }

  async function deletar(id, nome) {
    if (!confirm(`Excluir o cliente "${nome}" e todos os seus contatos?`)) return;
    try {
      await api.delete(`/clientes/${id}`);
      mostrar('Cliente excluído!', 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao excluir', 'erro');
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Clientes</h2>
        <button onClick={() => navigate('/clientes/novo')}>+ Novo Cliente</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>E-mail</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem' }}>Nenhum cliente cadastrado</td></tr>
          ) : clientes.map(c => (
            <tr key={c.id}>
              <td data-label="Nome">{c.nome}</td>
              <td data-label="CPF">{formatarCPF(c.cpf)}</td>
              <td data-label="E-mail">{c.email || '—'}</td>
              <td className="td-acoes">
                <button className="btn-editar" onClick={() => navigate(`/clientes/${c.id}/editar`)}>Editar</button>
                <button className="btn-deletar" onClick={() => deletar(c.id, c.nome)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
