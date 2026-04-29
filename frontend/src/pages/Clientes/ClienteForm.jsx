import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { validarCPF, aplicarMascara } from '../../utils/validacoes';
import { useMensagem } from '../../components/Mensagem';
import ContatosInline from './ContatosInline';

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cpfInvalido, setCpfInvalido] = useState(false);
  const [erroCpf, setErroCpf] = useState('');
  const [tiposContato, setTiposContato] = useState([]);
  const [clienteSalvo, setClienteSalvo] = useState(null);

  const editando = Boolean(id);

  useEffect(() => {
    api.get('/tipos-contato').then(res => setTiposContato(res.data)).catch(() => {});
    if (editando) {
      api.get(`/clientes/${id}`).then(res => {
        const c = res.data;
        setNome(c.nome || '');
        setCpf(formatarCPFLocal(c.cpf));
        setEmail(c.email || '');
        setDataNasc(c.data_nascimento || '');
        setEndereco(c.endereco || '');
        setClienteSalvo(c);
      }).catch(() => navigate('/clientes'));
    }
  }, [id]);

  function formatarCPFLocal(v) {
    const s = String(v).replace(/\D/g, '').padStart(11, '0');
    return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9,11)}`;
  }

  function handleCpfChange(e) {
    const mascarado = aplicarMascara(e.target.value, '999.999.999-99');
    setCpf(mascarado);
    setCpfInvalido(false);
    setErroCpf('');
  }

  function validarCampoCPF() {
    const valido = validarCPF(cpf);
    setCpfInvalido(!valido);
    setErroCpf(valido ? '' : 'CPF inválido');
    return valido;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validarCampoCPF()) return;

    const dados = {
      nome: nome.trim(),
      cpf: cpf.replace(/\D/g, ''),
      email: email.trim(),
      data_nascimento: dataNasc,
      endereco: endereco.trim(),
    };

    try {
      if (editando) {
        await api.put(`/clientes/${id}`, dados);
        mostrar('Cliente atualizado!', 'sucesso');
        setClienteSalvo({ ...clienteSalvo, ...dados, id: Number(id) });
      } else {
        const res = await api.post('/clientes', dados);
        mostrar('Cliente cadastrado!', 'sucesso');
        navigate(`/clientes/${res.data.id}/editar`, { replace: true });
      }
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/clientes')}>← Voltar para lista</button>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.25rem' }}>{editando ? 'Editar Cliente' : 'Novo Cliente'}</h2>

        <div className="campo">
          <label>Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="campo">
          <label>CPF *</label>
          <input
            value={cpf}
            onChange={handleCpfChange}
            onBlur={validarCampoCPF}
            className={cpfInvalido ? 'invalido' : ''}
            required
          />
          {erroCpf && <span className="erro-campo">{erroCpf}</span>}
        </div>
        <div className="campo">
          <label>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label>Data de Nascimento</label>
          <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} />
        </div>
        <div className="campo">
          <label>Endereço</label>
          <input value={endereco} onChange={e => setEndereco(e.target.value)} />
        </div>

        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/clientes')}>Cancelar</button>
        </div>
      </form>

      {editando && clienteSalvo ? (
        <ContatosInline clienteId={Number(id)} tiposContato={tiposContato} />
      ) : (
        !editando && (
          <div className="aviso-info" style={{ marginTop: '1.5rem' }}>
            <p>Salve o cliente primeiro para adicionar contatos.</p>
          </div>
        )
      )}
    </>
  );
}
