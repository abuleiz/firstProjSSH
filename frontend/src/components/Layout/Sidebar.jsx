import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ICONES = {
  dashboard:       <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>,
  clientes:        <path d="M12 12c2.71 0 4.8-2.09 4.8-4.8S14.71 2.4 12 2.4 7.2 4.49 7.2 7.2 9.29 12 12 12zm0 2.4c-3.21 0-9.6 1.61-9.6 4.8v2.4h19.2v-2.4c0-3.19-6.39-4.8-9.6-4.8z"/>,
  backoffice:      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>,
  usuarios:        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
  menus:           <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>,
  perfis:          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>,
  'tipos-contato': <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>,
  seguranca:       <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>,
  veiculos:        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>,
  'tabelas-aux':   <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4S4 11.21 4 9zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4S4 16.21 4 14z"/>,
  marcas:          <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>,
  modelos:         <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/>,
  versoes:         <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zm.01-2.54l7.36-5.73L21 8.93l-9-7-9 7 1.63 1.27L12 15.99z"/>,
  cores:           <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>,
};

function SvgIcone({ icon, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      {ICONES[icon] || null}
    </svg>
  );
}

const SETA = (
  <svg className="seta-submenu" viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
);

function buildTree(itens) {
  const raiz = itens.filter(i => !i.parent_id).sort((a, b) => a.ordem - b.ordem);
  const filhos = pai => itens.filter(i => i.parent_id === pai.id).sort((a, b) => a.ordem - b.ordem);
  return { raiz, filhos };
}

export default function Sidebar({ drawerAberto, onFechar, setTituloPagina }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [itens, setItens] = useState([]);
  const [abertos, setAbertos] = useState({});

  useEffect(() => {
    api.get('/menus').then(res => setItens(res.data)).catch(() => {});
  }, []);

  function toggle(icone) {
    setAbertos(prev => ({ ...prev, [icone]: !prev[icone] }));
  }

  function irPara(url, label) {
    if (setTituloPagina) setTituloPagina(label);
    navigate('/' + url);
    if (onFechar) onFechar();
  }

  function paginaAtual() {
    return location.pathname.replace(/^\//, '').split('/')[0];
  }

  const { raiz, filhos } = buildTree(itens);

  function renderItem(item, nivel = 0) {
    const children = filhos(item);
    const ativo = paginaAtual() === item.url;
    const paddingLeft = nivel > 0 ? `${1.25 + nivel * 1.35}rem` : '1.25rem';

    if (children.length > 0) {
      return (
        <li key={item.id} className={`menu-grupo${abertos[item.icon] ? ' aberto' : ''}`}>
          <div
            className="menu-item"
            style={{ paddingLeft }}
            onClick={() => toggle(item.icon)}
          >
            <SvgIcone icon={item.icon} size={nivel > 0 ? 16 : 18} />
            <span className="menu-label">{item.label}</span>
            {SETA}
          </div>
          <ul className={`submenu${abertos[item.icon] ? ' aberto' : ''}`}>
            {children.map(c => renderItem(c, nivel + 1))}
          </ul>
        </li>
      );
    }

    return (
      <li
        key={item.id}
        className={`menu-item${ativo ? ' ativo' : ''}`}
        style={{ paddingLeft }}
        onClick={() => irPara(item.url, item.label)}
      >
        <SvgIcone icon={item.icon} size={nivel > 0 ? 16 : 18} />
        <span className="menu-label">{item.label}</span>
      </li>
    );
  }

  return (
    <nav id="sidebar" className={drawerAberto ? 'drawer-aberto' : ''}>
      <div className="sidebar-logo">
        <SvgIcone icon="clientes" size={20} />
        <span className="menu-label">Gestão de Clientes</span>
      </div>
      <ul className="sidebar-menu">
        {raiz.map(item => renderItem(item))}
      </ul>
      <div className="sidebar-footer">
        <div className="usuario-info">
          <span className="nome-usuario">{usuario?.nome}</span>
          <span className={`badge-nivel ${usuario?.nivel}`}>
            {usuario?.perfil_nome || '—'}
          </span>
        </div>
        <button className="btn-logout" onClick={logout}>
          <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span className="menu-label">Sair</span>
        </button>
      </div>
    </nav>
  );
}
