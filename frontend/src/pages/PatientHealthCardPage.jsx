import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Printer, 
  Share2, 
  Download, 
  QrCode, 
  ShieldCheck, 
  Heart,
  Plus,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/CommonUI';
import { patientApi } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const PatientHealthCardPage = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatientDetails = async () => {
    if (!user?.patientId) return;
    try {
      setLoading(true);
      const res = await patientApi.getById(user.patientId);
      setPatient(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch clinical profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [user]);

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Handle Share Link Action
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/patient/${patient?._id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Patient Card Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-aayu-saffron/20 border-t-aayu-saffron rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Generating Health Card...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="p-4 bg-red-500/10 rounded-full text-red-400 mb-4">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Failed to load profile</h2>
        <p className="text-slate-400 text-sm max-w-md">{error || 'Patient card is unavailable.'}</p>
      </div>
    );
  }

  // Dynamic QR Code generation using public free API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/patient/${patient._id}`)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20 print:p-0 print:space-y-0"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
            <Heart className="w-3.5 h-3.5" />
            Digital Health Identity
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Smart <span className="text-aayu-emerald">Health Card</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Verify your clinic identity and share emergency profiles instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleShare} className="gap-2 px-5 py-3">
            <Share2 className="w-4 h-4" />
            Share Link
          </Button>
          <Button onClick={handlePrint} className="gap-2 px-6 py-3 bg-aayu-emerald hover:bg-aayu-emerald-light shadow-aayu-emerald/20">
            <Printer className="w-4 h-4" />
            Print / Download PDF
          </Button>
        </div>
      </div>

      {/* Main Grid: Card Viewer (Left) and Card Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Printable Card Frame */}
        <div className="lg:col-span-8 flex justify-center print:col-span-12 print:block">
          
          {/* Card Wrapper (Double sided mock or single premium credential) */}
          <div 
            id="aayu-smart-card"
            className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-aayu-navy to-slate-900 border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden print:border-black print:bg-white print:text-black print:shadow-none print:w-full print:max-w-none print:rounded-none"
          >
            {/* Ambient Background Grid Decor */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-aayu-emerald/5 blur-[100px] rounded-full -translate-y-1/3 translate-x-1/3 print:hidden" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-aayu-cyan/5 blur-[100px] rounded-full print:hidden" />

            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8 print:border-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-aayu-emerald rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-aayu-emerald/20 print:bg-green-600 print:shadow-none">
                  H
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight print:text-black">AAYU CONNECT</h2>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Healthcare Wallet</p>
                </div>
              </div>
              <Badge variant="ai" className="px-3 py-1 print:bg-slate-100 print:text-slate-800">
                ACTIVE PROFILE
              </Badge>
            </div>

            {/* Card Content Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Photo & Basic stats */}
              <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                <div className="w-28 h-28 bg-gradient-to-br from-aayu-emerald to-aayu-cyan p-1 rounded-2xl shadow-xl print:from-slate-200 print:to-slate-300 print:shadow-none">
                  <div className="w-full h-full bg-aayu-navy-deep rounded-[12px] flex items-center justify-center text-5xl font-black text-white print:bg-slate-100 print:text-black">
                    {patient.fullName[0]}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient ID</p>
                  <p className="text-xs font-bold text-white tracking-wider print:text-black">
                    {patient._id.slice(-10).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Patient Core Details */}
              <div className="md:col-span-6 space-y-6">
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight mb-1 print:text-black">
                    {patient.fullName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-400 print:text-slate-700">Age: {patient.age}y</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-bold text-slate-400 print:text-slate-700">Gender: {patient.gender}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-white/5 print:border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Blood Group</p>
                    <p className="text-sm font-bold text-white print:text-black">{patient.bloodGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ABHA ID</p>
                    <p className="text-sm font-bold text-aayu-cyan print:text-blue-800">{patient.abhaId || 'Not Linked'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Emergency Contact</p>
                    <p className="text-sm font-bold text-white print:text-black">{patient.emergencyContact || 'Not Linked'}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code */}
              <div className="md:col-span-3 flex flex-col items-center justify-center space-y-3 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 print:border-slate-100 md:pl-6">
                <div className="bg-white p-2.5 rounded-2xl shadow-xl">
                  <img 
                    src={qrUrl} 
                    alt="Patient QR Code" 
                    className="w-28 h-28" 
                    crossOrigin="anonymous"
                  />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center flex items-center gap-1.5 print:text-slate-600">
                  <QrCode className="w-3.5 h-3.5 text-aayu-emerald" />
                  Scan to Verify
                </span>
              </div>

            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-slate-500 text-[9px] uppercase font-bold tracking-widest print:border-slate-300 print:text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-aayu-emerald" />
                MedAI Secure HIPAA Identity
              </span>
              <span>Ref: {patient._id}</span>
            </div>

          </div>

        </div>

        {/* Right Column: Medical Details Summary */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <Card className="p-6 border-white/10 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <FileText className="text-aayu-saffron w-4 h-4" />
              Clinical Summary
            </h3>

            {/* Chronic Conditions */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Chronic Conditions</p>
              <div className="flex flex-wrap gap-2">
                {patient.chronicDiseases && patient.chronicDiseases.length > 0 ? (
                  patient.chronicDiseases.map((d, i) => (
                    <Badge key={i} variant="warning">{d}</Badge>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-slate-400">No chronic diseases registered</span>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Known Allergies</p>
              <div className="flex flex-wrap gap-2">
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((a, i) => (
                    <Badge key={i} variant="danger">{a}</Badge>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-slate-400">No allergies registered</span>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Registered Address</p>
              <p className="text-xs font-bold text-slate-300 leading-relaxed">{patient.address || 'No address registered'}</p>
            </div>

            {/* Insurance Info Mock */}
            <div className="space-y-1 border-t border-white/5 pt-4">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Insurance Provider</p>
              <p className="text-xs font-bold text-white">United Health Coverage</p>
              <p className="text-[10px] text-slate-500">Policy #UHC-8742-990 • Group 4022</p>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
};

export default PatientHealthCardPage;
