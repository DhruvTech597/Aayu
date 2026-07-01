import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui/CommonUI';
import { ShieldAlert, ArrowLeft, Key } from 'lucide-react';
import Aayu3DBackground from '../components/three/Aayu3DBackground';

const UnauthorizedPage = () => {
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
        <Card className="p-8 md:p-10 border-red-500/20 bg-red-500/[0.02] text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/5 blur-[60px] rounded-full" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex p-4 bg-red-500/10 rounded-3xl text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5">
              <ShieldAlert className="w-12 h-12" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Access Restrained</h1>
              <p className="text-xs text-red-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Authorization Code 403
              </p>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
              Your account credential does not possess active permissions to explore this workspace node. Contact the medical administration team if you think this is a mistake.
            </p>
            
            <div className="pt-4 flex flex-col gap-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full py-3 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
