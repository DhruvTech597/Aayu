import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-aayu-navy-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-aayu-emerald/20 border-t-aayu-emerald rounded-full animate-spin" />
          <p className="text-slate-500 animate-pulse text-xs font-bold uppercase tracking-widest">Verifying Doctor Session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;
