import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useMensagem } from '../../components/Mensagem';

const ANO_MAX = new Date().getFullYear() + 1;
const ANO_MIN = 1900;

function validarPlaca(placa) {
  const p = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  // Formato antigo: ABC1234
  if (/^[A-Z]{3}\d{4}$/.test(p)) return true;
  // Mercosul: ABC1D23
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(p)) return true;
  return false;
}

function normalizarPlaca(placa) {
  const p = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  // Formato antigo: adiciona traço
  if (/^[A-Z]{3}\d{4}$/.test(p)) return `${p.slice(0, 3)}-${p.slice(3)}`;
  return p;
}

export default function VeiculoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mostrar = useMensagem();
  const editando = Boolean(id);

  // Dados do veículo
  const [marcaId,   setMarcaId]   = useState('');
  const [modeloId,  setModeloId]  = useState('');
  const [versaoId,  setVersaoId]  = useState('');
  const [corId,     setCorId]     = useState('');
  const [anoFab,    setAnoFab]    = useState('');
  const [anoMod,    setAnoMod]    = useState('');

  // Identificação
  const [placa,      setPlaca]      = useState('');
  const [erroPlaca,  setErroPlaca]  = useState('');
  const [renavam,    setRenavam]    = useState('');
  const [erroRenavam, setErroRenavam] = useState('');
  const [chassi,     setChassi]     = useState('');
  const [erroChassi, setErroChassi] = useState('');

  // Observações
  const [observacoes, setObservacoes] = useState('');

  // Listas para selects
  const [marcas,  setMarcas]  = useState([]);
  const [modelos, setModelos] = useState([]);
  const [versoes, setVersoes] = useState([]);
  const [cores,   setCores]   = useState([]);

  useEffect(() => {
    api.get('/marcas').then(res => setMarcas(res.data)).catch(() => {});
    api.get('/cores').then(res => setCores(res.data)).catch(() => {});

    if (editando) {
      api.get(`/veiculos/${id}`)
        .then(async v => {
          setMarcaId(String(v.data.marca_id));
          setCorId(String(v.data.cor_id));
          setAnoFab(v.data.ano_fabricacao ?? '');
          setAnoMod(v.data.ano_modelo ?? '');
          setPlaca(v.data.placa ?? '');
          setRenavam(v.data.renavam ?? '');
          setChassi(v.data.chassi ?? '');
          setObservacoes(v.data.observacoes ?? '');

          // Carrega modelos da marca
          const modelosRes = await api.get(`/modelos?marca_id=${v.data.marca_id}`);
          setModelos(modelosRes.data);
          setModeloId(String(v.data.modelo_id));

          // Carrega versões do modelo
          if (v.data.modelo_id) {
            const versoesRes = await api.get(`/versoes?modelo_id=${v.data.modelo_id}`);
            setVersoes(versoesRes.data);
            if (v.data.versao_id) setVersaoId(String(v.data.versao_id));
          }
        })
        .catch(() => navigate('/veiculos'));
    }
  }, [id]);

  async function handleMarcaChange(e) {
    const val = e.target.value;
    setMarcaId(val);
    setModeloId('');
    setVersaoId('');
    setModelos([]);
    setVersoes([]);
    if (val) {
      const res = await api.get(`/modelos?marca_id=${val}`);
      setModelos(res.data);
    }
  }

  async function handleModeloChange(e) {
    const val = e.target.value;
    setModeloId(val);
    setVersaoId('');
    setVersoes([]);
    if (val) {
      const res = await api.get(`/versoes?modelo_id=${val}`);
      setVersoes(res.data);
    }
  }

  function handlePlacaChange(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
    setPlaca(val);
    setErroPlaca('');
  }

  function validarCampoPlaca() {
    if (!placa) { setErroPlaca('Placa é obrigatória'); return false; }
    if (!validarPlaca(placa)) {
      setErroPlaca('Placa inválida. Use ABC-1234 (antigo) ou ABC1D23 (Mercosul)');
      return false;
    }
    setErroPlaca('');
    return true;
  }

  function validarCampoRenavam() {
    if (renavam && !/^\d{11}$/.test(renavam)) {
      setErroRenavam('RENAVAM deve ter exatamente 11 dígitos numéricos');
      return false;
    }
    setErroRenavam('');
    return true;
  }

  function validarCampoChassi() {
    if (chassi && !/^[A-Z0-9]{17}$/i.test(chassi)) {
      setErroChassi('Chassi deve ter exatamente 17 caracteres alfanuméricos');
      return false;
    }
    setErroChassi('');
    return true;
  }

  function validarAnos() {
    if (anoFab && (Number(anoFab) < ANO_MIN || Number(anoFab) > ANO_MAX)) {
      mostrar(`Ano de fabricação deve estar entre ${ANO_MIN} e ${ANO_MAX}`, 'erro');
      return false;
    }
    if (anoMod && (Number(anoMod) < ANO_MIN || Number(anoMod) > ANO_MAX)) {
      mostrar(`Ano do modelo deve estar entre ${ANO_MIN} e ${ANO_MAX}`, 'erro');
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const placaOk   = validarCampoPlaca();
    const renavamOk = validarCampoRenavam();
    const chassiOk  = validarCampoChassi();
    const anosOk    = validarAnos();
    if (!placaOk || !renavamOk || !chassiOk || !anosOk) return;

    const dados = {
      marca_id:      Number(marcaId),
      modelo_id:     Number(modeloId),
      versao_id:     versaoId ? Number(versaoId) : null,
      cor_id:        Number(corId),
      placa:         normalizarPlaca(placa),
      ano_fabricacao: anoFab ? Number(anoFab) : null,
      ano_modelo:    anoMod ? Number(anoMod) : null,
      renavam:       renavam || null,
      chassi:        chassi ? chassi.toUpperCase() : null,
      observacoes:   observacoes || null,
    };

    try {
      if (editando) {
        await api.put(`/veiculos/${id}`, dados);
        mostrar('Veículo atualizado!', 'sucesso');
      } else {
        const res = await api.post('/veiculos', dados);
        mostrar('Veículo cadastrado!', 'sucesso');
        navigate(`/veiculos/${res.data.id}/editar`, { replace: true });
      }
    } catch (err) {
      mostrar(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    }
  }

  return (
    <>
      <button className="btn-voltar" onClick={() => navigate('/veiculos')}>← Voltar para lista</button>
      <h2 style={{ marginBottom: '1rem' }}>{editando ? 'Editar Veículo' : 'Novo Veículo'}</h2>

      <form className="form-secoes" onSubmit={handleSubmit}>

        <div className="secao-form">
          <h3>Dados do Veículo</h3>

          <div className="campo">
            <label>Marca *</label>
            <select value={marcaId} onChange={handleMarcaChange} required>
              <option value="">Selecione a marca...</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div className="campo">
            <label>Modelo *</label>
            <select value={modeloId} onChange={handleModeloChange} required disabled={!marcaId}>
              <option value="">Selecione o modelo...</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div className="campo">
            <label>Versão</label>
            <select value={versaoId} onChange={e => setVersaoId(e.target.value)} disabled={!modeloId}>
              <option value="">Selecione a versão...</option>
              {versoes.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </div>

          <div className="campo">
            <label>Cor *</label>
            <select value={corId} onChange={e => setCorId(e.target.value)} required>
              <option value="">Selecione a cor...</option>
              {cores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="campos-inline">
            <div className="campo">
              <label>Ano de Fabricação</label>
              <input
                type="number"
                value={anoFab}
                onChange={e => setAnoFab(e.target.value)}
                min={ANO_MIN}
                max={ANO_MAX}
                placeholder={`${ANO_MIN}–${ANO_MAX}`}
              />
            </div>
            <div className="campo">
              <label>Ano do Modelo</label>
              <input
                type="number"
                value={anoMod}
                onChange={e => setAnoMod(e.target.value)}
                min={ANO_MIN}
                max={ANO_MAX}
                placeholder={`${ANO_MIN}–${ANO_MAX}`}
              />
            </div>
          </div>
        </div>

        <div className="secao-form">
          <h3>Identificação</h3>

          <div className="campo">
            <label>Placa *</label>
            <input
              value={placa}
              onChange={handlePlacaChange}
              onBlur={validarCampoPlaca}
              className={erroPlaca ? 'invalido' : ''}
              placeholder="ABC-1234 ou ABC1D23"
              required
            />
            {erroPlaca && <span className="erro-campo">{erroPlaca}</span>}
          </div>

          <div className="campo">
            <label>RENAVAM <span className="label-hint">(11 dígitos)</span></label>
            <input
              value={renavam}
              onChange={e => setRenavam(e.target.value.replace(/\D/g, '').slice(0, 11))}
              onBlur={validarCampoRenavam}
              className={erroRenavam ? 'invalido' : ''}
              maxLength={11}
              placeholder="00000000000"
            />
            {erroRenavam && <span className="erro-campo">{erroRenavam}</span>}
          </div>

          <div className="campo">
            <label>Chassi <span className="label-hint">(17 caracteres)</span></label>
            <input
              value={chassi}
              onChange={e => setChassi(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17))}
              onBlur={validarCampoChassi}
              className={erroChassi ? 'invalido' : ''}
              maxLength={17}
              placeholder="9BWZZZ377VT004251"
            />
            {erroChassi && <span className="erro-campo">{erroChassi}</span>}
          </div>
        </div>

        <div className="secao-form">
          <h3>Observações</h3>
          <div className="campo">
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={4}
              placeholder="Observações gerais sobre o veículo..."
            />
          </div>
        </div>

        <div className="acoes-form">
          <button type="submit">Salvar</button>
          <button type="button" className="btn-secundario" onClick={() => navigate('/veiculos')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
