import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/apiService';
import { Button, Input } from '../components/ui/CommonUI';
import { Sparkles, Lock, ShieldCheck, CheckCircle, Users, Calendar, Activity } from 'lucide-react';
import Aayu3DBackground from '../components/three/Aayu3DBackground';
import { toast } from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Access key must be at least 6 characters'),
  clinicCode: z.string().min(4, 'Clinic Authorization Code is required'),
  phone: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = ['receptionist', 'doctor', 'patient'].includes(roleParam) ? roleParam : 'doctor';
  const [activeRole, setActiveRole] = useState(initialRole);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: 'Male',
    }
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Patient validation states
  const [abhaIdInput, setAbhaIdInput] = useState('');
  const [abhaIdVerified, setAbhaIdVerified] = useState(false);
  const [verifyingAbha, setVerifyingAbha] = useState(false);
  const [verifiedPatientData, setVerifiedPatientData] = useState(null);

  const resetAbha = () => {
    setAbhaIdVerified(false);
    setAbhaIdInput('');
    setVerifiedPatientData(null);
  };

  const handleVerifyAbha = async () => {
    if (!abhaIdInput || abhaIdInput.trim() === '') {
      setError('Please enter your ABHA ID');
      return;
    }
    setVerifyingAbha(true);
    setError('');
    try {
      const res = await authApi.verifyAbha({ abhaId: abhaIdInput });
      const patientData = res.data.data;
      setVerifiedPatientData(patientData);
      setAbhaIdVerified(true);
      
      // Populate hook-form values
      setValue('name', patientData.fullName);
      setValue('phone', patientData.phone);
      setValue('age', String(patientData.age));
      setValue('gender', patientData.gender);
      
      toast.success('ABHA ID verified successfully! Configure credentials.');
    } catch (err) {
      setError(err.response?.data?.message || 'No onboarded patient found with this ABHA ID.');
      toast.error('ABHA ID verification failed.');
    } finally {
      setVerifyingAbha(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Validate security clinic code (AAYU2026)
    if (data.clinicCode.toUpperCase() !== 'AAYU2026') {
      setError('Invalid Clinic Authorization Code');
      setIsLoading(false);
      return;
    }

    if (activeRole === 'patient') {
      if (!abhaIdVerified) {
        setError('Please verify your ABHA ID first.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: activeRole,
        phone: activeRole === 'patient' ? data.phone : undefined,
        age: activeRole === 'patient' ? Number(data.age) : undefined,
        gender: activeRole === 'patient' ? data.gender : undefined,
        abhaId: activeRole === 'patient' ? abhaIdInput.trim() : undefined,
      };
      
      await authApi.register(payload);
      setSuccess('Profile initialized successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/login?role=${activeRole}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
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
    ? 'bg-gradient-to-br from-aayu-emerald to-aayu-emerald-light shadow-aayu-emerald/20' 
    : isReceptionist 
      ? 'bg-gradient-to-br from-aayu-cyan to-aayu-cyan-light shadow-aayu-cyan/20' 
      : 'bg-gradient-to-br from-aayu-saffron to-aayu-saffron-light shadow-aayu-saffron/20';

  const brandText = isDoctor 
    ? 'text-aayu-emerald' 
    : isReceptionist 
      ? 'text-aayu-cyan' 
      : 'text-aayu-saffron';

  const submitButtonColor = isDoctor 
    ? 'bg-aayu-emerald hover:bg-aayu-emerald-light shadow-aayu-emerald/20' 
    : isReceptionist 
      ? 'bg-aayu-cyan hover:bg-aayu-cyan/80 shadow-aayu-cyan/20' 
      : 'bg-aayu-saffron hover:bg-aayu-saffron/80 shadow-aayu-saffron/20';

  const headerLabel = isDoctor 
    ? 'Initialize Practitioner account' 
    : isReceptionist 
      ? 'Initialize operations staff' 
      : 'Initialize patient portal account';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Aayu3DBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-8 md:p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient background glows */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 ${glowColor} blur-[80px] rounded-full transition-colors duration-500`} />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-900/40 blur-[80px] rounded-full" />

          <div className="text-center mb-6 relative z-10">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${brandColor} rounded-2xl mb-4 shadow-xl transform rotate-3 transition-colors duration-500`}>
              <Sparkles className="text-white w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
              Join <span className={brandText + " transition-colors duration-500"}>Aayu</span>
            </h1>
            <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">
              {headerLabel}
            </p>
          </div>

          {/* Premium Selector Tabs */}
          <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/5 mb-6 relative z-10">
            <button
              type="button"
              onClick={() => { setActiveRole('doctor'); setError(''); resetAbha(); }}
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
              onClick={() => { setActiveRole('receptionist'); setError(''); resetAbha(); }}
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
              onClick={() => { setActiveRole('patient'); setError(''); resetAbha(); }}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
            {isPatient && !abhaIdVerified ? (
              /* STEP 1: Verify ABHA ID */
              <div className="space-y-4">
                <Input
                  label="ABHA ID (Digital Health ID)"
                  placeholder="e.g. 12-3456-7890-12"
                  value={abhaIdInput}
                  onChange={(e) => setAbhaIdInput(e.target.value)}
                  type="text"
                />

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
                  type="button"
                  onClick={handleVerifyAbha}
                  disabled={verifyingAbha}
                  className="w-full py-4 text-sm font-black uppercase tracking-widest bg-aayu-saffron hover:bg-aayu-saffron/80 shadow-aayu-saffron/20"
                >
                  {verifyingAbha ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying Health Identity...
                    </div>
                  ) : 'Verify Health Identity'}
                </Button>
              </div>
            ) : (
              /* STEP 2: Configure Credentials (or regular staff onboarding) */
              <>
                <Input 
                  label={isDoctor ? "Full Practitioner Name" : isReceptionist ? "Full Staff Name" : "Full Patient Name"} 
                  {...register('name')} 
                  error={errors.name?.message}
                  placeholder={isDoctor ? "Dr. Rajesh Kumar" : isReceptionist ? "Rahul Sharma" : "Jane Doe"} 
                  type="text"
                  disabled={isPatient}
                />
                
                <Input 
                  label={isDoctor ? "Professional Medical Email" : isReceptionist ? "Staff Corporate Email" : "Patient Portal Email"} 
                  {...register('email')} 
                  error={errors.email?.message}
                  placeholder={isDoctor ? "doctor@clinic.com" : isReceptionist ? "receptionist@clinic.com" : "patient@aayu.connect"} 
                  type="email"
                />

                {isPatient && (
                  <>
                    <Input 
                      label="Registered Phone Number" 
                      {...register('phone')} 
                      error={errors.phone?.message}
                      placeholder="e.g. 9876543210" 
                      type="tel"
                      disabled={true}
                    />
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input 
                          label="Age" 
                          {...register('age')} 
                          error={errors.age?.message}
                          placeholder="e.g. 28" 
                          type="number"
                          disabled={true}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                        <select
                          {...register('gender')}
                          disabled={true}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:border-aayu-saffron/50 focus:ring-1 focus:ring-aayu-saffron/50 text-xs font-medium animate-none"
                        >
                          <option value="Male" className="bg-slate-950 text-white">Male</option>
                          <option value="Female" className="bg-slate-950 text-white">Female</option>
                          <option value="Other" className="bg-slate-950 text-white">Other</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <Input 
                  label="Secure Access Key" 
                  type="password" 
                  {...register('password')} 
                  error={errors.password?.message}
                  placeholder="Min. 6 characters"
                />
                
                <Input 
                  label="Clinic Auth Code (AAYU2026)" 
                  type="text" 
                  {...register('clinicCode')} 
                  error={errors.clinicCode?.message}
                  placeholder="e.g. AAYU2026"
                />

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

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-xl bg-aayu-emerald/10 border border-aayu-emerald/20 flex items-center gap-3 text-aayu-emerald text-xs font-bold uppercase tracking-wider animate-pulse"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {success}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className={`w-full py-4 text-sm font-black uppercase tracking-widest mt-2 transition-colors duration-500 ${submitButtonColor}`}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Workspace...
                    </div>
                  ) : (
                    isDoctor ? 'Onboard Practitioner' : isReceptionist ? 'Onboard Receptionist' : 'Onboard Patient'
                  )}
                </Button>
              </>
            )}
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            Already authorized?{' '}
            <Link 
              to={`/login?role=${activeRole}`} 
              className={`font-bold underline transition-colors ${isDoctor ? 'text-aayu-emerald hover:text-aayu-emerald-light' : isReceptionist ? 'text-aayu-cyan hover:text-aayu-cyan/80' : 'text-aayu-saffron hover:text-aayu-saffron/80'}`}
            >
              Sign In
            </Link>
          </p>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-slate-500 text-[9px] uppercase font-bold tracking-widest">
            <ShieldCheck className={`w-3.5 h-3.5 ${isDoctor ? 'text-aayu-emerald' : isReceptionist ? 'text-aayu-cyan' : 'text-aayu-saffron'}`} />
            Clinic Network Enforced Session
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

export default RegisterPage;
