import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function MarcaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');

  useEffect(() => {
    if (editando) {
      api.get(`/marcas/${id}`)
        .then(res => setNome(res.data.nome))
        .catch(() => navigate('/marcas'));
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/marcas/${id}`, { nome: nome.trim() });
        mostrar('Marca atualizada!', 'sucesso');
      } else {
        await api.post('/marcas', { nome: nome.trim() });
        mostrar('Marca criada!', 'sucesso');
      }
      navigate('/marcas');
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/marcas')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Marca' : 'Nova Marca'}</h2>
        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required autoFocus />
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/marcas')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
