import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Redireciona para login quando a sessão expirar durante o uso
// Não redireciona se já estiver na tela de login (evita loop)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
