import { useState, useEffect } from 'react';
import api from '../../services/api';
import { validarContato, aplicarMascara } from '../../utils/validacoes';
import { useMensagem } from '../../components/Mensagem';

export default function ContatosInline({ clienteId, tiposContato }) {
  const [contatos, setContatos] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  const [contatoId, setContatoId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [valor, setValor] = useState('');
  const [erroContato, setErroContato] = useState('');
  const mostrar = useMensagem();

  useEffect(() => { carregar(); }, [clienteId]);

  useEffect(() => {
    if (tiposContato.length > 0 && !tipoId) {
      setTipoId(String(tiposContato[0].id));
    }
  }, [tiposContato]);

  async function carregar() {
    const res = await api.get(`/clientes/${clienteId}`);
    setContatos(res.data.contatos || []);
  }

  function tipoAtual() {
    return tiposContato.find(t => t.id === Number(tipoId)) || null;
  }

  function handleValorChange(e) {
    const tipo = tipoAtual();
    let v = e.target.value;
    if (tipo?.mascara && tipo.validacao === 'telefone') {
      v = aplicarMascara(v, tipo.mascara);
    }
    setValor(v);
    setErroContato('');
  }

  function abrirNovo() {
    setContatoId('');
    setValor('');
    setErroContato('');
    if (tiposContato.length > 0) setTipoId(String(tiposContato[0].id));
    setFormAberto(true);
  }

  function abrirEditar(c) {
    setContatoId(String(c.id));
    setTipoId(String(c.tipo_id));
    setValor(c.telefone);
    setErroContato('');
    setFormAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    const tipo = tipoAtual();
    const erro = tipo ? validarContato(tipo, valor) : 'Selecione um tipo';
    if (erro) { setErroContato(erro); return; }

    try {
      const dados = { telefone: valor.trim(), tipo_id: Number(tipoId) };
      if (contatoId) {
        await api.put(`/contatos/${contatoId}`, dados);
        mostrar('Contato atualizado!', 'sucesso');
      } else {
        await api.post(`/contatos/cliente/${clienteId}`, dados);
        mostrar('Contato adicionado!', 'sucesso');
      }
      setFormAberto(false);
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar contato', 'erro');
    }
  }

  async function deletar(id) {
    if (!confirm('Excluir este contato?')) return;
    try {
      await api.delete(`/contatos/${id}`);
      mostrar('Contato excluído!', 'sucesso');
      carregar();
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao excluir', 'erro');
    }
  }

  const tipo = tipoAtual();
  const placeholder = tipo?.placeholder || '';

  return (
    <div className="secao-contatos-inline">
      <div className="contatos-cabecalho cabecalho-secao">
        <h3>Contatos</h3>
        <button type="button" onClick={abrirNovo}>+ Adicionar</button>
      </div>

      {formAberto && (
        <div className="form-contato-wrapper">
          <p className="form-contato-titulo">{contatoId ? 'Editar Contato' : 'Adicionar Contato'}</p>
          <form onSubmit={salvar}>
            <div className="campos-inline">
              <div className="campo">
                <label>Tipo</label>
                <select value={tipoId} onChange={e => { setTipoId(e.target.value); setValor(''); }}>
                  {tiposContato.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Contato</label>
                <input
                  value={valor}
                  onChange={handleValorChange}
                  placeholder={placeholder}
                  required
                />
                {erroContato && <span className="erro-campo">{erroContato}</span>}
              </div>
              <div className="campo-botao">
                <button type="submit">Salvar</button>
                <button type="button" className="btn-secundario" onClick={() => setFormAberto(false)}>Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Contato</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contatos.length === 0 ? (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#aaa', padding: '1rem' }}>Nenhum contato cadastrado</td></tr>
          ) : contatos.map(c => (
            <tr key={c.id}>
              <td data-label="Tipo">{c.tipo_nome}</td>
              <td data-label="Contato">{c.telefone}</td>
              <td className="td-acoes">
                <button className="btn-editar" type="button" onClick={() => abrirEditar(c)}>Editar</button>
                <button className="btn-deletar" type="button" onClick={() => deletar(c.id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
