import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AdminLayout from '@/layouts/AdminLayout';
import RequireAuth from '@/components/RequireAuth';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Artists from '@/pages/Artists';
import Requests from '@/pages/Requests';
import Appointments from '@/pages/Appointments';
import Products from '@/pages/Products';
import Invites from '@/pages/Invites';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected admin shell */}
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/users"        element={<Users />} />
            <Route path="/artists"      element={<Artists />} />
            <Route path="/requests"     element={<Requests />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/products"     element={<Products />} />
            <Route path="/invites"      element={<Invites />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
