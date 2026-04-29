import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Mensagem from '../Mensagem';

const TITULOS = {
  dashboard:       'Dashboard',
  clientes:        'Cadastro de Clientes',
  veiculos:        'Veículos',
  usuarios:        'Usuários',
  menus:           'Menus',
  perfis:          'Perfis',
  'tipos-contato': 'Tipos de Contato',
  marcas:          'Marcas',
  modelos:         'Modelos',
  versoes:         'Versões',
  cores:           'Cores',
};

export default function Layout() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [drawerAberto, setDrawerAberto] = useState(false);

  useEffect(() => {
    const segmento = location.pathname.replace(/^\//, '').split('/')[0];
    setTitulo(TITULOS[segmento] || '');
    setDrawerAberto(false); // fecha drawer ao navegar
  }, [location.pathname]);

  return (
    <div className="layout">
      <div
        className={`overlay${drawerAberto ? ' visivel' : ''}`}
        onClick={() => setDrawerAberto(false)}
      />
      <Sidebar
        drawerAberto={drawerAberto}
        onFechar={() => setDrawerAberto(false)}
        setTituloPagina={setTitulo}
      />
      <div className="area-principal">
        <header>
          <button
            className="btn-hamburger"
            onClick={() => setDrawerAberto(v => !v)}
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <h1>{titulo}</h1>
          <span className="header-usuario">{usuario?.nome}</span>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <Mensagem />
    </div>
  );
}
