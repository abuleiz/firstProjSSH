import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (usuario) navigate('/dashboard', { replace: true });
  }, [usuario, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao realizar login');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">Gestão de Clientes</div>
        <h2>Entrar</h2>
        {erro && <div className="erro-login">{erro}</div>}
        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="campo">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
