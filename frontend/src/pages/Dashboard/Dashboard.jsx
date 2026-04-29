import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [totalClientes, setTotalClientes] = useState('—');

  useEffect(() => {
    api.get('/clientes').then(res => setTotalClientes(res.data.length)).catch(() => {});
  }, []);

  return (
    <>
      <div className="cards-dashboard">
        <div className="card-stat">
          <span className="card-stat-numero">{totalClientes}</span>
          <span className="card-stat-label">Clientes cadastrados</span>
        </div>
      </div>
      <div className="dashboard-boas-vindas">
        <h2>Bem-vindo, {usuario?.nome}!</h2>
        <p>Use o menu lateral para navegar pelo sistema.</p>
      </div>
    </>
  );
}
