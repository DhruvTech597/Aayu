import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Aayu3DBackground from './components/three/Aayu3DBackground';
import AppRoutes from './routes/index';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Aayu3DBackground />
        
        <Suspense 
          fallback={
            <div className="h-screen w-full flex items-center justify-center bg-aayu-navy-deep">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-aayu-emerald/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-aayu-emerald border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-500 animate-pulse text-xs font-bold uppercase tracking-widest">
                  Loading Aayu OS...
                </p>
              </div>
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

