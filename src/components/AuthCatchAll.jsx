import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/LoginPage';

export default function AuthCatchAll() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-echo-bg">
        <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user || isGuest) return <Navigate to="/" replace />;
  return <LoginPage />;
}
