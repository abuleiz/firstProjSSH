import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

export default function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [usuarioId, setUsuarioId] = useState(id || '');

  // perfis inline
  const [perfisUsuario, setPerfisUsuario] = useState([]);
  const [todosPerfis, setTodosPerfis] = useState([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState('');
  const [formPerfilAberto, setFormPerfilAberto] = useState(false);
  const [salvo, setSalvo] = useState(editando);

  useEffect(() => {
    if (editando) {
      api.get(`/usuarios/${id}`).then(res => {
        setNome(res.data.nome);
        setEmail(res.data.email);
      }).catch(() => navigate('/usuarios'));
      carregarPerfisUsuario(id);
    }
  }, [id]);

  async function carregarPerfisUsuario(uid) {
    const res = await api.get(`/usuarios/${uid}/perfis`);
    setPerfisUsuario(res.data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const dados = { nome: nome.trim(), email: email.trim(), senha };
    try {
      if (editando) {
        await api.put(`/usuarios/${id}`, dados);
        mostrar('Usuário atualizado!', 'sucesso');
        setSalvo(true);
      } else {
        const res = await api.post('/usuarios', dados);
        mostrar('Usuário criado!', 'sucesso');
        const novoId = res.data.id;
        setUsuarioId(String(novoId));
        setSenha('');
        setSalvo(true);
        navigate(`/usuarios/${novoId}/editar`, { replace: true });
      }
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  async function abrirFormPerfil() {
    const res = await api.get('/perfis');
    setTodosPerfis(res.data);
    if (res.data.length > 0) setPerfilSelecionado(String(res.data[0].id));
    setFormPerfilAberto(true);
  }

  async function adicionarPerfil() {
    const uid = id || usuarioId;
    try {
      await api.post(`/usuarios/${uid}/perfis`, { perfil_id: Number(perfilSelecionado) });
      mostrar('Perfil adicionado!', 'sucesso');
      setFormPerfilAberto(false);
      carregarPerfisUsuario(uid);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro', 'erro');
    }
  }

  async function removerPerfil(perfilId) {
    if (!confirm('Remover este perfil do usuário?')) return;
    const uid = id || usuarioId;
    try {
      await api.delete(`/usuarios/${uid}/perfis/${perfilId}`);
      mostrar('Perfil removido!', 'sucesso');
      carregarPerfisUsuario(uid);
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/usuarios')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="campo">
          <label>E-mail *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="campo">
          <label>
            Senha {editando && <span className="label-hint">(deixe em branco para manter a atual)</span>}
          </label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required={!editando}
            minLength={editando ? 0 : 6}
          />
        </div>
        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/usuarios')}>Cancelar</button>
        </div>
      </form>

      {salvo ? (
        <div className="secao-contatos-inline">
          <div className="contatos-cabecalho cabecalho-secao">
            <h3>Perfis do Usuário</h3>
            <button type="button" onClick={abrirFormPerfil}>+ Adicionar Perfil</button>
          </div>

          {formPerfilAberto && (
            <div className="form-contato-wrapper">
              <div className="campos-inline">
                <div className="campo">
                  <label>Perfil</label>
                  <select value={perfilSelecionado} onChange={e => setPerfilSelecionado(e.target.value)}>
                    {todosPerfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="campo-botao">
                  <button type="button" onClick={adicionarPerfil}>Adicionar</button>
                  <button type="button" className="btn-secundario" onClick={() => setFormPerfilAberto(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          <table>
            <thead>
              <tr><th>Perfil</th><th>Nível</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {perfisUsuario.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: '#aaa', padding: '1rem' }}>Nenhum perfil atribuído</td></tr>
              ) : perfisUsuario.map(p => (
                <tr key={p.id}>
                  <td data-label="Perfil">{p.nome}</td>
                  <td data-label="Nível"><span className={`badge-nivel ${p.nivel === 1 ? 'admin' : 'usuario'}`}>{p.nivel === 1 ? 'Admin' : 'Usuário'}</span></td>
                  <td className="td-acoes"><button className="btn-deletar" type="button" onClick={() => removerPerfil(p.id)}>Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="aviso-info" style={{ marginTop: '1.5rem' }}>
          <p>Salve o usuário primeiro para atribuir perfis.</p>
        </div>
      )}
    </>
  );
}
