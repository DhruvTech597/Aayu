import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui/CommonUI';
import { patientApi, doctorApi } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const patientSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  age: z.coerce.number().min(0, 'Age must be positive').max(120, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
  phone: z.string().min(10, 'Valid phone number required').max(15),
  abhaId: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  assignedDoctor: z.string().min(1, 'Please assign a doctor'),
});

const PatientRegistration = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await doctorApi.list();
        setDoctorsList(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch doctors', error);
      }
    };
    fetchDoctors();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });
    try {
      const payload = {
        fullName: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone.replace(/[\s\-\(\)]/g, ''),
        abhaId: data.abhaId || undefined,
        bloodGroup: data.bloodGroup || undefined,
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        chronicDiseases: data.chronicDiseases ? data.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : [],
        assignedDoctor: data.assignedDoctor,
      };
      const response = await patientApi.create(payload);
      setSubmitStatus({ type: 'success', message: 'Patient registered successfully!' });
      setTimeout(() => navigate('/patients'), 2000);
    } catch (error) {
      let errMsg = error.response?.data?.message || 'Failed to register patient';
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorDetails = error.response.data.errors.map(e => Object.values(e)[0]).filter(Boolean).join(", ");
        if (errorDetails) {
          errMsg = `${errMsg}: ${errorDetails}`;
        }
      }
      setSubmitStatus({ 
        type: 'error', 
        message: errMsg 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-10 pb-20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight">
                Onboard <span className="text-aayu-emerald">Patient</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm">Initialize a new secure clinical record in Aayu OS</p>
            </div>
          </div>
          <div className="p-4 bg-aayu-emerald/10 rounded-2xl text-aayu-emerald border border-aayu-emerald/20">
            <UserPlus className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 space-y-8 border-white/10 hover:border-aayu-emerald/30 transition-all">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-aayu-emerald rounded-full" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Biometric & Basic Identity</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input 
                      label="Full Registered Name" 
                      {...register('name')} 
                      error={errors.name?.message}
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>
                  
                  <Input 
                    label="Age" 
                    type="number" 
                    {...register('age')} 
                    error={errors.age?.message}
                    placeholder="0"
                  />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                    <select 
                      {...register('gender')}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:border-aayu-emerald/50 focus:ring-1 focus:ring-aayu-emerald/50"
                    >
                      <option value="" className="bg-aayu-navy">Select Gender</option>
                      <option value="Male" className="bg-aayu-navy">Male</option>
                      <option value="Female" className="bg-aayu-navy">Female</option>
                      <option value="Other" className="bg-aayu-navy">Other</option>
                    </select>
                    {errors.gender && <p className="text-[10px] font-bold text-red-400 ml-1 uppercase tracking-tight">{errors.gender.message}</p>}
                  </div>
                </div>

                <Input 
                  label="Primary Contact Number" 
                  {...register('phone')} 
                  error={errors.phone?.message}
                  placeholder="+91 00000 00000"
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Doctor</label>
                  <select 
                    {...register('assignedDoctor')}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none transition-all focus:border-aayu-emerald/50 focus:ring-1 focus:ring-aayu-emerald/50"
                  >
                    <option value="" className="bg-aayu-navy">Select Doctor...</option>
                    {doctorsList.map(doc => (
                      <option key={doc._id} value={doc._id} className="bg-aayu-navy">Dr. {doc.name} ({doc.specialization})</option>
                    ))}
                  </select>
                  {errors.assignedDoctor && <p className="text-[10px] font-bold text-red-400 ml-1 uppercase tracking-tight">{errors.assignedDoctor.message}</p>}
                </div>
              </div>
            </Card>

            <Card className="p-8 space-y-8 border-white/10 hover:border-aayu-cyan/30 transition-all">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-aayu-cyan rounded-full" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Clinical Profile Baseline</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="ABHA ID (Digital Health ID)" 
                    {...register('abhaId')} 
                    placeholder="Optional identification"
                  />
                  <Input 
                    label="Blood Group" 
                    {...register('bloodGroup')} 
                    placeholder="e.g. O+"
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Known Allergies" 
                      {...register('allergies')} 
                      placeholder="List any medication or food allergies"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input 
                      label="Chronic Medical Conditions" 
                      {...register('chronicDiseases')} 
                      placeholder="e.g. Type 2 Diabetes, Hypertension"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-aayu-emerald/30 bg-aayu-emerald/5 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-aayu-emerald/20 rounded-lg text-aayu-emerald">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Security Audit</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adding a patient to Aayu OS creates an immutable, encrypted health record. All data is synchronized across the clinic's secure network.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="w-1 h-1 bg-aayu-emerald rounded-full" />
                  HIPAA Compliant
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="w-1 h-1 bg-aayu-emerald rounded-full" />
                  End-to-End Encryption
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="w-1 h-1 bg-aayu-emerald rounded-full" />
                  ABHA Integrated
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {submitStatus.type === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-aayu-emerald/10 border border-aayu-emerald/20 rounded-2xl text-aayu-emerald text-sm font-bold"
                >
                  <CheckCircle className="w-5 h-5" />
                  {submitStatus.message}
                </motion.div>
              )}
              {submitStatus.type === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5" />
                  {submitStatus.message}
                </motion.div>
              )}
              
              <Button 
                type="submit" 
                onClick={handleSubmit(onSubmit)}
                className="w-full py-4 text-base font-bold uppercase tracking-widest shadow-xl shadow-aayu-emerald/20"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Initializing...
                  </div>
                ) : 'Confirm Registration'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PatientRegistration;

