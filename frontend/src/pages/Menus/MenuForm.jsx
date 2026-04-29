import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

const ICONES_DISPONIVEIS = ['dashboard', 'clientes', 'backoffice', 'usuarios', 'menus', 'perfis', 'tipos-contato', 'seguranca'];

export default function MenuForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');
  const [url, setUrl] = useState('');
  const [parentId, setParentId] = useState('');
  const [perfilId, setPerfilId] = useState('');
  const [ordem, setOrdem] = useState(0);
  const [ativo, setAtivo] = useState(true);
  const [menusRaiz, setMenusRaiz] = useState([]);
  const [perfis, setPerfis] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/menus/raiz'), api.get('/perfis')]).then(([mr, mp]) => {
      setMenusRaiz(mr.data);
      setPerfis(mp.data);
      if (!editando && mp.data.length > 0) setPerfilId(String(mp.data[0].id));
    });

    if (editando) {
      api.get(`/menus/${id}`).then(res => {
        const m = res.data;
        setLabel(m.label);
        setIcon(m.icon);
        setUrl(m.url || '');
        setParentId(m.parent_id ? String(m.parent_id) : '');
        setPerfilId(String(m.perfil_id));
        setOrdem(m.ordem);
        setAtivo(Boolean(m.ativo));
      }).catch(() => navigate('/menus'));
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    const dados = {
      label: label.trim(),
      icon: icon.trim(),
      url: url.trim() || null,
      parent_id: parentId || null,
      perfil_id: Number(perfilId),
      ordem: Number(ordem),
      ativo,
    };
    try {
      if (editando) {
        await api.put(`/menus/${id}`, dados);
        mostrar('Menu atualizado!', 'sucesso');
      } else {
        await api.post('/menus', dados);
        mostrar('Menu criado!', 'sucesso');
      }
      navigate('/menus');
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/menus')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Menu' : 'Novo Menu'}</h2>
        <div className="campo">
          <label>Label *</label>
          <input value={label} onChange={e => setLabel(e.target.value)} required />
        </div>
        <div className="campo">
          <label>Ícone *</label>
          <select value={icon} onChange={e => setIcon(e.target.value)} required>
            <option value="">Selecione...</option>
            {ICONES_DISPONIVEIS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="ex: clientes" />
        </div>
        <div className="campo">
          <label>Menu Pai</label>
          <select value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">Nenhum (item raiz)</option>
            {menusRaiz.filter(m => String(m.id) !== id).map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Perfil *</label>
          <select value={perfilId} onChange={e => setPerfilId(e.target.value)} required>
            {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Ordem</label>
          <input type="number" value={ordem} onChange={e => setOrdem(e.target.value)} min={0} />
        </div>
        <div className="campo campo-checkbox">
          <label>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
            Ativo
          </label>
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/menus')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
