import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Messes from './pages/Messes';
import Orders from './pages/Orders';
import Subscriptions from './pages/Subscriptions';
import Revenue from './pages/Revenue';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import Roles from './pages/Roles';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/messes" element={<Messes />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/revenue" element={<Revenue />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin-users" element={<AdminUsers />} />
        <Route path="/roles" element={<Roles />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
