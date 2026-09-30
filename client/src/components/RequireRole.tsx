import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types/user';
import type { ReactNode } from 'react';

interface Props {
  roles: UserRole[];
  children: ReactNode;
}

export default function RequireRole({ roles, children }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
