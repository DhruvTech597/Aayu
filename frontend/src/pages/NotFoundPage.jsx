import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui/CommonUI';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Aayu3DBackground from '../components/three/Aayu3DBackground';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-aayu-navy-deep">
      <Aayu3DBackground />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="p-8 md:p-10 border-white/10 bg-white/[0.01] text-center shadow-2xl relative overflow-hidden">
          {/* Subtle themed pulse */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-aayu-emerald/5 blur-[80px] rounded-full" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex p-4 bg-white/5 border border-white/10 rounded-3xl text-slate-400">
              <FileQuestion className="w-12 h-12 text-aayu-emerald" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-white tracking-tighter">404</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Workspace Node Not Located
              </p>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              The clinical pathway or resource node you are seeking has either migrated or does not exist inside Aayu OS.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={() => navigate(-1)} className="py-3 px-4 gap-2 flex-1">
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button onClick={() => navigate('/dashboard')} className="py-3 px-4 gap-2 flex-1">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
