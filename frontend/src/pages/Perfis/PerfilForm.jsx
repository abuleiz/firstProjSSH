import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function PerfilForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (editando) {
      api.get(`/perfis/${id}`).then(res => {
        setNome(res.data.nome);
        setDescricao(res.data.descricao || '');
        setAtivo(Boolean(res.data.ativo));
      }).catch(() => navigate('/perfis'));
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    const dados = { nome: nome.trim(), descricao: descricao.trim(), ativo };
    try {
      if (editando) {
        await api.put(`/perfis/${id}`, dados);
        mostrar('Perfil atualizado!', 'sucesso');
      } else {
        await api.post('/perfis', dados);
        mostrar('Perfil criado!', 'sucesso');
      }
      navigate('/perfis');
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/perfis')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Perfil' : 'Novo Perfil'}</h2>
        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="campo">
          <label>Descrição</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
        <div className="campo campo-checkbox">
          <label>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
            Ativo
          </label>
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/perfis')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
