import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUsuario(res.data))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  async function login(email, senha) {
    const res = await api.post('/auth/login', { email, senha });
    setUsuario(res.data);
    return res.data;
  }

  async function logout() {
    await api.post('/auth/logout');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
