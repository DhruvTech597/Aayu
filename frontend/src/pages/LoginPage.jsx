import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui/CommonUI';
import { Sparkles, ShieldCheck, Users, Calendar, Activity, ChevronRight } from 'lucide-react';
import Aayu3DBackground from '../components/three/Aayu3DBackground';
import { toast } from 'react-hot-toast';
import authBanner from '../assets/auth_banner.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid medical email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = ['receptionist', 'doctor', 'patient'].includes(roleParam) ? roleParam : 'doctor';
  
  const [activeRole, setActiveRole] = useState(initialRole);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    const result = await login(data);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      toast.success("Access authorized!");
    }
  };

  const isDoctor = activeRole === 'doctor';
  const isReceptionist = activeRole === 'receptionist';
  const isPatient = activeRole === 'patient';

  // Determine active color theme
  const brandText = isDoctor 
    ? 'text-aayu-emerald' 
    : isReceptionist 
      ? 'text-aayu-cyan' 
      : 'text-aayu-saffron';

  const brandBg = isDoctor 
    ? 'bg-aayu-emerald' 
    : isReceptionist 
      ? 'bg-aayu-cyan' 
      : 'bg-aayu-saffron';

  const submitButtonColor = isDoctor 
    ? 'bg-aayu-emerald hover:bg-aayu-emerald-light shadow-aayu-emerald/20' 
    : isReceptionist 
      ? 'bg-aayu-cyan hover:bg-aayu-cyan/85 shadow-aayu-cyan/20' 
      : 'bg-aayu-saffron hover:bg-aayu-saffron/85 shadow-aayu-saffron/20';

  return (
    <div className="relative min-h-screen bg-aayu-navy-deep overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <Aayu3DBackground />

      {/* LEFT SIDE PANEL: Premium Healthcare Visuals */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden flex-col justify-between p-16 h-screen select-none">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={authBanner} 
            alt="Aayu Medical Cloud" 
            className="w-full h-full object-cover scale-105 filter brightness-[0.7] contrast-[1.1] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aayu-navy-deep via-aayu-navy-deep/60 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 30%, var(--aayu-bg) 95%)" />
        </div>

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
            <Sparkles className="text-aayu-primary-light w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xl font-black text-white tracking-widest uppercase">
            Aayu <span className="text-aayu-primary-light">OS</span>
          </span>
        </div>

        {/* Text descriptions */}
        <div className="relative z-10 space-y-4 max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Clinical operations, <br/>reimagined.
            </h2>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed font-medium">
              Access patients records, biometric telemetry logs, and diagnostic dashboards in a secure, audit-ready space.
            </p>
          </motion.div>

          <div className="flex gap-2.5 items-center text-[10px] text-aayu-primary-light font-black uppercase tracking-widest pt-2">
            <ShieldCheck className="w-4 h-4" />
            End-to-End HIPAA Enforced Gateway
          </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL: Centered Form Card */}
      <div className="col-span-12 lg:col-span-7 min-h-screen flex items-center justify-center p-6 md:p-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          <div className="glass-card p-8 md:p-10 border border-aayu-border relative overflow-hidden">
            {/* Header Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Sign In to <span className={brandText + " transition-colors duration-500"}>Aayu</span>
              </h1>
              <p className="text-slate-400 font-medium text-xs mt-1">
                {isDoctor ? 'Clinical Lead Workspace' : isReceptionist ? 'Lobby Administration Node' : 'Patient Portal Node'}
              </p>
            </div>

            {/* Role Select Tabs */}
            <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-aayu-border mb-6">
              {[
                { id: 'doctor', label: 'Doctor', icon: Users },
                { id: 'receptionist', label: 'Staff', icon: Calendar },
                { id: 'patient', label: 'Patient', icon: Activity }
              ].map((role) => {
                const Icon = role.icon;
                const active = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => { setActiveRole(role.id); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${
                      active
                        ? `${brandBg} text-white shadow-lg shadow-black/20`
                        : 'text-aayu-text-secondary hover:text-aayu-text-primary'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {role.label}
                  </button>
                );
              })}
            </div>

            {/* Input fields form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input 
                label={isDoctor ? "Clinician Medical Email" : isReceptionist ? "Staff Operations Email" : "Patient Portal Email"} 
                {...register('email')} 
                error={errors.email?.message}
                placeholder={isDoctor ? "doctor@clinic.com" : isReceptionist ? "receptionist@clinic.com" : "patient@aayu.connect"} 
                type="email"
              />
              <Input 
                label="Access Password" 
                type="password" 
                {...register('password')} 
                error={errors.password?.message}
                placeholder="••••••••"
              />

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest"
                >
                  <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button 
                type="submit" 
                className={`w-full py-4 uppercase font-black text-xs tracking-widest ${submitButtonColor}`}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {isDoctor ? 'Access Clinical Workspace' : isReceptionist ? 'Initialize Reception Desk' : 'Access Patient Portal'}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-aayu-text-secondary mt-6 font-medium">
              {isPatient ? 'New Patient? ' : 'Need clinical access? '}
              <Link 
                to={`/register?role=${activeRole}`} 
                className={`font-black underline transition-colors ${brandText}`}
              >
                {isPatient ? 'Register Patient Account' : 'Register Workspace'}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const AlertTriangleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default LoginPage;
