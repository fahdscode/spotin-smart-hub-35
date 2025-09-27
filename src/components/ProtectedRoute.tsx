import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  redirectTo = '/'
}) => {
  const { isAuthenticated, userRole, isLoading, user } = useAuth();

  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated,
    userRole,
    isLoading,
    requiredRole,
    userId: user?.id
  });

  if (isLoading) {
    console.log('⏳ Auth still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('❌ Role check failed:', {
        userRole,
        allowedRoles,
        hasRole: allowedRoles.includes(userRole || '')
      });
      return <Navigate to="/" replace />;
    }
  }

  console.log('✅ Access granted!');
  return <>{children}</>;
};