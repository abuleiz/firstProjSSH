import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function ModeloForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    api.get('/marcas').then(res => setMarcas(res.data)).catch(() => {});

    if (editando) {
      api.get(`/modelos/${id}`)
        .then(res => {
          setNome(res.data.nome);
          setMarcaId(String(res.data.marca_id));
        })
        .catch(() => navigate('/modelos'));
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!marcaId) { mostrar('Selecione a marca', 'erro'); return; }
    try {
      const dados = { nome: nome.trim(), marca_id: Number(marcaId) };
      if (editando) {
        await api.put(`/modelos/${id}`, dados);
        mostrar('Modelo atualizado!', 'sucesso');
      } else {
        await api.post('/modelos', dados);
        mostrar('Modelo criado!', 'sucesso');
      }
      navigate('/modelos');
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/modelos')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Modelo' : 'Novo Modelo'}</h2>
        <div className="campo">
          <label>Marca *</label>
          <select value={marcaId} onChange={e => setMarcaId(e.target.value)} required>
            <option value="">Selecione a marca...</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/modelos')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
