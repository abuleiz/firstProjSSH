import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function TipoContatoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');
  const [mascara, setMascara] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [validacao, setValidacao] = useState('texto');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (editando) {
      api.get(`/tipos-contato/${id}`).then(res => {
        setNome(res.data.nome);
        setMascara(res.data.mascara || '');
        setPlaceholder(res.data.placeholder || '');
        setValidacao(res.data.validacao);
        setAtivo(Boolean(res.data.ativo));
      }).catch(() => navigate('/tipos-contato'));
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    const dados = { nome: nome.trim(), mascara: mascara.trim(), placeholder: placeholder.trim(), validacao, ativo };
    try {
      if (editando) {
        await api.put(`/tipos-contato/${id}`, dados);
        mostrar('Tipo atualizado!', 'sucesso');
      } else {
        await api.post('/tipos-contato', dados);
        mostrar('Tipo criado!', 'sucesso');
      }
      navigate('/tipos-contato');
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/tipos-contato')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Tipo de Contato' : 'Novo Tipo de Contato'}</h2>
        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="campo">
          <label>Máscara <span className="label-hint">(ex: (99) 99999-9999)</span></label>
          <input value={mascara} onChange={e => setMascara(e.target.value)} placeholder="(99) 99999-9999" />
        </div>
        <div className="campo">
          <label>Placeholder</label>
          <input value={placeholder} onChange={e => setPlaceholder(e.target.value)} />
        </div>
        <div className="campo">
          <label>Validação *</label>
          <select value={validacao} onChange={e => setValidacao(e.target.value)} required>
            <option value="telefone">Telefone</option>
            <option value="email">E-mail</option>
            <option value="texto">Texto</option>
          </select>
        </div>
        <div className="campo campo-checkbox">
          <label>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
            Ativo
          </label>
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/tipos-contato')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
