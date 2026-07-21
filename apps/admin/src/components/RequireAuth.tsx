import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

export default function RequireAuth() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
