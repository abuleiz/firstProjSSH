import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientesList from './pages/Clientes/ClientesList';
import ClienteForm from './pages/Clientes/ClienteForm';
import UsuariosList from './pages/Usuarios/UsuariosList';
import UsuarioForm from './pages/Usuarios/UsuarioForm';
import MenusList from './pages/Menus/MenusList';
import MenuForm from './pages/Menus/MenuForm';
import PerfisList from './pages/Perfis/PerfisList';
import PerfilForm from './pages/Perfis/PerfilForm';
import TiposContatoList from './pages/TiposContato/TiposContatoList';
import TipoContatoForm from './pages/TiposContato/TipoContatoForm';
import VeiculosList from './pages/Veiculos/VeiculosList';
import VeiculoForm from './pages/Veiculos/VeiculoForm';
import MarcasList from './pages/Marcas/MarcasList';
import MarcaForm from './pages/Marcas/MarcaForm';
import ModelosList from './pages/Modelos/ModelosList';
import ModeloForm from './pages/Modelos/ModeloForm';
import VersoesList from './pages/Versoes/VersoesList';
import VersaoForm from './pages/Versoes/VersaoForm';
import CoresList from './pages/Cores/CoresList';
import CoreForm from './pages/Cores/CoreForm';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientesList />} />
            <Route path="/clientes/novo" element={<ClienteForm />} />
            <Route path="/clientes/:id/editar" element={<ClienteForm />} />
            <Route path="/veiculos" element={<VeiculosList />} />
            <Route path="/veiculos/novo" element={<VeiculoForm />} />
            <Route path="/veiculos/:id/editar" element={<VeiculoForm />} />
            <Route path="/usuarios" element={<PrivateRoute adminOnly><UsuariosList /></PrivateRoute>} />
            <Route path="/usuarios/novo" element={<PrivateRoute adminOnly><UsuarioForm /></PrivateRoute>} />
            <Route path="/usuarios/:id/editar" element={<PrivateRoute adminOnly><UsuarioForm /></PrivateRoute>} />
            <Route path="/menus" element={<PrivateRoute adminOnly><MenusList /></PrivateRoute>} />
            <Route path="/menus/novo" element={<PrivateRoute adminOnly><MenuForm /></PrivateRoute>} />
            <Route path="/menus/:id/editar" element={<PrivateRoute adminOnly><MenuForm /></PrivateRoute>} />
            <Route path="/perfis" element={<PrivateRoute adminOnly><PerfisList /></PrivateRoute>} />
            <Route path="/perfis/novo" element={<PrivateRoute adminOnly><PerfilForm /></PrivateRoute>} />
            <Route path="/perfis/:id/editar" element={<PrivateRoute adminOnly><PerfilForm /></PrivateRoute>} />
            <Route path="/tipos-contato" element={<PrivateRoute adminOnly><TiposContatoList /></PrivateRoute>} />
            <Route path="/tipos-contato/novo" element={<PrivateRoute adminOnly><TipoContatoForm /></PrivateRoute>} />
            <Route path="/tipos-contato/:id/editar" element={<PrivateRoute adminOnly><TipoContatoForm /></PrivateRoute>} />
            <Route path="/marcas" element={<PrivateRoute adminOnly><MarcasList /></PrivateRoute>} />
            <Route path="/marcas/novo" element={<PrivateRoute adminOnly><MarcaForm /></PrivateRoute>} />
            <Route path="/marcas/:id/editar" element={<PrivateRoute adminOnly><MarcaForm /></PrivateRoute>} />
            <Route path="/modelos" element={<PrivateRoute adminOnly><ModelosList /></PrivateRoute>} />
            <Route path="/modelos/novo" element={<PrivateRoute adminOnly><ModeloForm /></PrivateRoute>} />
            <Route path="/modelos/:id/editar" element={<PrivateRoute adminOnly><ModeloForm /></PrivateRoute>} />
            <Route path="/versoes" element={<PrivateRoute adminOnly><VersoesList /></PrivateRoute>} />
            <Route path="/versoes/novo" element={<PrivateRoute adminOnly><VersaoForm /></PrivateRoute>} />
            <Route path="/versoes/:id/editar" element={<PrivateRoute adminOnly><VersaoForm /></PrivateRoute>} />
            <Route path="/cores" element={<PrivateRoute adminOnly><CoresList /></PrivateRoute>} />
            <Route path="/cores/novo" element={<PrivateRoute adminOnly><CoreForm /></PrivateRoute>} />
            <Route path="/cores/:id/editar" element={<PrivateRoute adminOnly><CoreForm /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
