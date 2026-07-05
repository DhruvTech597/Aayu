import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/apiService';
import { Button, Input } from '../components/ui/CommonUI';
import { Sparkles, ShieldCheck, CheckCircle, Users, Calendar, Activity, ChevronRight } from 'lucide-react';
import Aayu3DBackground from '../components/three/Aayu3DBackground';
import { toast } from 'react-hot-toast';
import authBanner from '../assets/auth_banner.png';

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

  const resetAbha = () => {
    setAbhaIdVerified(false);
    setAbhaIdInput('');
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
      ? 'bg-aayu-cyan hover:bg-aayu-cyan/80 shadow-aayu-cyan/20' 
      : 'bg-aayu-saffron hover:bg-aayu-saffron/80 shadow-aayu-saffron/20';

  const headerLabel = isDoctor 
    ? 'Initialize Practitioner account' 
    : isReceptionist 
      ? 'Initialize operations staff' 
      : 'Initialize patient portal account';

  return (
    <div className="relative min-h-screen bg-aayu-navy-deep overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <Aayu3DBackground />

      {/* LEFT SIDE PANEL: Visual Banner */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden flex-col justify-between p-16 h-screen select-none">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={authBanner} 
            alt="Aayu Medical Cloud" 
            className="w-full h-full object-cover scale-105 filter brightness-[0.7] contrast-[1.1]"
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
              Begin Clinical <br/>Onboarding.
            </h2>
            <p className="text-slate-300 text-xs mt-3 leading-relaxed font-medium">
              Create your secure workspace portal or link your state ABHA identification card to activate medical telemetry records.
            </p>
          </motion.div>

          <div className="flex gap-2.5 items-center text-[10px] text-aayu-primary-light font-black uppercase tracking-widest pt-2">
            <ShieldCheck className="w-4 h-4" />
            End-to-End HIPAA Enforced Gateway
          </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL: Registration Form Card */}
      <div className="col-span-12 lg:col-span-7 min-h-screen flex items-center justify-center p-6 md:p-16 relative z-10 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[460px] my-8"
        >
          <div className="glass-card p-8 md:p-10 border border-aayu-border relative overflow-hidden">
            {/* Header Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Join <span className={brandText + " transition-colors duration-500"}>Aayu</span>
              </h1>
              <p className="text-slate-400 font-medium text-xs mt-1">
                {headerLabel}
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
                    onClick={() => { setActiveRole(role.id); setError(''); resetAbha(); }}
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest"
                    >
                      <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <Button 
                    type="button" 
                    onClick={handleVerifyAbha}
                    disabled={verifyingAbha}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest bg-aayu-saffron hover:bg-aayu-saffron/80 text-white"
                  >
                    {verifyingAbha ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying Health Identity...
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Verify Health Identity
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              ) : (
                /* STEP 2: Configure Credentials */
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
                          <label className="text-[10px] font-bold text-aayu-text-secondary uppercase tracking-widest ml-1">Gender</label>
                          <select
                            {...register('gender')}
                            disabled={true}
                            className="w-full bg-white/[0.02] border border-aayu-border rounded-xl px-4 py-3.5 text-xs text-aayu-text-primary outline-none transition-all focus:border-aayu-saffron/50 focus:ring-1 focus:ring-aayu-saffron/50 font-medium animate-none"
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
                      className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest"
                    >
                      <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3.5 rounded-xl bg-aayu-emerald/10 border border-aayu-emerald/20 flex items-center gap-3 text-aayu-emerald text-xs font-bold uppercase tracking-wider animate-pulse"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {success}
                    </motion.div>
                  )}

                  <Button 
                    type="submit" 
                    className={`w-full py-4 text-xs font-black uppercase tracking-widest mt-2 transition-colors duration-500 ${submitButtonColor}`}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Workspace...
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {isDoctor ? 'Onboard Practitioner' : isReceptionist ? 'Onboard Staff' : 'Onboard Patient'}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </>
              )}
            </form>

            <p className="text-center text-xs text-aayu-text-secondary mt-6 font-medium">
              Already authorized?{' '}
              <Link 
                to={`/login?role=${activeRole}`} 
                className={`font-black underline transition-colors ${brandText}`}
              >
                Sign In
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

export default RegisterPage;
