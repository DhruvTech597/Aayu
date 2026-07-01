import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui/CommonUI';
import { Sparkles, Lock, ShieldCheck, Users, Calendar, Activity } from 'lucide-react';
import Aayu3DBackground from '../components/three/Aayu3DBackground';
import { toast } from 'react-hot-toast';
import { authApi } from '../services/apiService';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid medical email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
  const { login, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = ['receptionist', 'doctor', 'patient'].includes(roleParam) ? roleParam : 'doctor';
  
  const [activeRole, setActiveRole] = useState(initialRole);
  const [patientLoginMode, setPatientLoginMode] = useState('phone'); // 'phone' or 'email'
  
  // Custom states for Phone + OTP login
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send Simulated OTP Handler
  const handleSendOtp = async () => {
    if (!phone) {
      toast.error('Please enter your registered phone number');
      return;
    }
    setSendingOtp(true);
    setError('');
    try {
      const response = await authApi.sendOTP({ phone });
      const { otp: generatedOtp } = response.data.data;
      setOtpSent(true);
      toast.success(`Simulated OTP Sent: ${generatedOtp}`, { duration: 8000 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch verification code.');
      toast.error(err.response?.data?.message || 'OTP dispatch failed.');
    } finally {
      setSendingOtp(false);
    }
  };

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

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (!phone || !otp) {
      toast.error('Phone and Verification code are required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.loginOTP({ phone, otp });
      const { token } = response.data.data;
      localStorage.setItem('aayu_token', token);
      await refreshUser();
      toast.success("Access authorized!");
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
      setIsLoading(false);
    }
  };

  const isDoctor = activeRole === 'doctor';
  const isReceptionist = activeRole === 'receptionist';
  const isPatient = activeRole === 'patient';

  // Determine active glow color
  const glowColor = isDoctor 
    ? 'bg-aayu-emerald/10' 
    : isReceptionist 
      ? 'bg-aayu-cyan/10' 
      : 'bg-aayu-saffron/10';

  const brandColor = isDoctor 
    ? 'bg-aayu-emerald shadow-aayu-emerald/30' 
    : isReceptionist 
      ? 'bg-aayu-cyan shadow-aayu-cyan/30' 
      : 'bg-aayu-saffron shadow-aayu-saffron/30';

  const brandText = isDoctor 
    ? 'text-aayu-emerald' 
    : isReceptionist 
      ? 'text-aayu-cyan' 
      : 'text-aayu-saffron';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Aayu3DBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient background glows */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 ${glowColor} blur-[80px] rounded-full transition-colors duration-500`} />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-900/40 blur-[80px] rounded-full" />

          <div className="text-center mb-6 relative z-10">
            <div className={`inline-flex items-center justify-center w-20 h-20 ${brandColor} rounded-3xl mb-6 shadow-2xl transform rotate-3 transition-colors duration-500`}>
              <Sparkles className="text-white w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              Aayu <span className={brandText + " transition-colors duration-500"}>OS</span>
            </h1>
            <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">
              {isDoctor ? 'Clinical Practitioner Node' : isReceptionist ? 'Lobby Operations Node' : 'Patient Portal Node'}
            </p>
          </div>

          {/* Premium Selector Tabs */}
          <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/5 mb-6 relative z-10">
            <button
              type="button"
              onClick={() => { setActiveRole('doctor'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isDoctor
                  ? 'bg-aayu-emerald text-white shadow-lg shadow-aayu-emerald/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Doctor
            </button>
            <button
              type="button"
              onClick={() => { setActiveRole('receptionist'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isReceptionist
                  ? 'bg-aayu-cyan text-white shadow-lg shadow-aayu-cyan/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Staff
            </button>
            <button
              type="button"
              onClick={() => { setActiveRole('patient'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                isPatient
                  ? 'bg-aayu-saffron text-white shadow-lg shadow-aayu-saffron/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Patient
            </button>
          </div>

          {/* Patient login mode toggle */}
          {isPatient && (
            <div className="flex justify-center gap-4 mb-6 relative z-10 text-xs font-bold uppercase tracking-wider">
              <button 
                type="button"
                className={`pb-1 border-b-2 transition-all ${patientLoginMode === 'phone' ? 'border-aayu-saffron text-white' : 'border-transparent text-slate-500'}`}
                onClick={() => { setPatientLoginMode('phone'); setError(''); }}
              >
                Phone + OTP
              </button>
              <button 
                type="button"
                className={`pb-1 border-b-2 transition-all ${patientLoginMode === 'email' ? 'border-aayu-saffron text-white' : 'border-transparent text-slate-500'}`}
                onClick={() => { setPatientLoginMode('email'); setError(''); }}
              >
                Email + Password
              </button>
            </div>
          )}

          {isPatient && patientLoginMode === 'phone' ? (
            /* PHONE + OTP AUTHENTICATION */
            <form onSubmit={handleOtpLogin} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input 
                      label="Registered Phone Number" 
                      placeholder="e.g. 9876543210" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={otpSent}
                      type="tel"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleSendOtp}
                    disabled={sendingOtp || otpSent || !phone}
                    className="mb-0.5 px-4 py-3 bg-aayu-cyan hover:bg-aayu-cyan/80 text-[10px] font-black uppercase tracking-widest"
                  >
                    {sendingOtp ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
                  </Button>
                </div>

                {otpSent && (
                  <Input 
                    label="Enter 6-Digit OTP" 
                    placeholder="••••••" 
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                )}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-wider"
                >
                  <AlertTriangleIcon className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full py-4 text-sm font-black uppercase tracking-widest bg-aayu-saffron hover:bg-aayu-saffron/80 shadow-aayu-saffron/20"
                disabled={isLoading || !otpSent}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying OTP...
                  </div>
                ) : 'Access Patient Portal'}
              </Button>
            </form>
          ) : (
            /* EMAIL + PASSWORD AUTHENTICATION (DEFAULT) */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <div className="space-y-4">
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
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-wider"
                >
                  <AlertTriangleIcon className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button 
                type="submit" 
                className={`w-full py-4 text-sm font-black uppercase tracking-widest transition-colors duration-500 ${isDoctor ? 'bg-aayu-emerald hover:bg-aayu-emerald-light shadow-aayu-emerald/20' : isReceptionist ? 'bg-aayu-cyan hover:bg-aayu-cyan/80 shadow-aayu-cyan/20' : 'bg-aayu-saffron hover:bg-aayu-saffron/80 shadow-aayu-saffron/20'}`}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  isDoctor ? 'Access Clinical Workspace' : isReceptionist ? 'Initialize Reception Desk' : 'Access Patient Portal'
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            {isPatient ? 'New Patient? ' : 'Need clinic access? '}
            <Link 
              to={`/register?role=${activeRole}`} 
              className={`font-bold underline transition-colors ${isDoctor ? 'text-aayu-emerald hover:text-aayu-emerald-light' : isReceptionist ? 'text-aayu-cyan hover:text-aayu-cyan/80' : 'text-aayu-saffron hover:text-aayu-saffron/80'}`}
            >
              {isPatient ? 'Register Patient Account' : 'Register Workspace'}
            </Link>
          </p>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            <ShieldCheck className={`w-3.5 h-3.5 ${isDoctor ? 'text-aayu-emerald' : isReceptionist ? 'text-aayu-cyan' : 'text-aayu-saffron'}`} />
            End-to-End HIPAA Enforced Session
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AlertTriangleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default LoginPage;
