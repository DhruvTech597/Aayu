import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-aayu-navy-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-aayu-emerald/20 border-t-aayu-emerald rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse text-xs font-bold uppercase tracking-widest">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
