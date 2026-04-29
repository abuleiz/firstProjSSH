import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, adminOnly = false }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;

  if (!usuario) return <Navigate to="/login" replace />;

  if (adminOnly && usuario.nivel !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}
