import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function VersaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [modeloId, setModeloId] = useState('');
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);

  useEffect(() => {
    api.get('/marcas').then(res => setMarcas(res.data)).catch(() => {});

    if (editando) {
      api.get(`/versoes/${id}`)
        .then(async res => {
          setNome(res.data.nome);
          const mId = res.data.marca_id;
          setMarcaFiltro(String(mId));
          const modelosRes = await api.get(`/modelos?marca_id=${mId}`);
          setModelos(modelosRes.data);
          setModeloId(String(res.data.modelo_id));
        })
        .catch(() => navigate('/versoes'));
    }
  }, [id]);

  async function handleMarcaChange(e) {
    const val = e.target.value;
    setMarcaFiltro(val);
    setModeloId('');
    setModelos([]);
    if (val) {
      const res = await api.get(`/modelos?marca_id=${val}`);
      setModelos(res.data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!modeloId) { mostrar('Selecione o modelo', 'erro'); return; }
    try {
      const dados = { nome: nome.trim(), modelo_id: Number(modeloId) };
      if (editando) {
        await api.put(`/versoes/${id}`, dados);
        mostrar('Versão atualizada!', 'sucesso');
      } else {
        await api.post('/versoes', dados);
        mostrar('Versão criada!', 'sucesso');
      }
      navigate('/versoes');
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/versoes')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Versão' : 'Nova Versão'}</h2>
        <div className="campo">
          <label>Marca <span className="label-hint">(filtro)</span></label>
          <select value={marcaFiltro} onChange={handleMarcaChange}>
            <option value="">Selecione a marca...</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Modelo *</label>
          <select value={modeloId} onChange={e => setModeloId(e.target.value)} required disabled={!marcaFiltro}>
            <option value="">Selecione o modelo...</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/versoes')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
