import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

export function ControlRoomProtectedRoute({ children }: { children: ReactNode }) {
  const { isOperator } = useAuth();
  const location = useLocation();

  if (!isOperator) {
    return <Navigate to="/control-room/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
