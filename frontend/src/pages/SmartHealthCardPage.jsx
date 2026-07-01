import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Pill,
  Sparkles,
  ArrowLeft,
  Upload,
  CheckCircle,
  ChevronRight,
  Search,
  Plus,
  X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { patientApi, visitApi, reportApi, doctorApi } from '../services/apiService';
import { toast } from 'react-hot-toast';

const SmartHealthCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [errorDetails, setErrorDetails] = useState(null);
  const [activeVisit, setActiveVisit] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInDoctorId, setCheckInDoctorId] = useState('');
  const [checkInSymptoms, setCheckInSymptoms] = useState('');

  const fetchPatientData = async () => {
    try {
      const patientRes = await patientApi.getById(id);
      setPatient(patientRes.data.data);
      
      try {
        const visitsRes = await visitApi.getByPatient(id);
        const list = visitsRes.data.data || [];
        setVisits(list);
        
        const active = list.find(v => v.status === 'waiting' || v.status === 'in_consultation');
        if (active) {
          setActiveVisit(active);
          setSymptoms(active.symptoms || '');
          setDiagnosis(active.diagnosis || '');
          setNotes(active.notes || '');
          setPrescription(active.prescription || '');
        } else {
          setActiveVisit(null);
        }
      } catch (visitErr) {
        console.log("No visits found or visits failed to load", visitErr);
        setVisits([]);
        setActiveVisit(null);
      }
    } catch (error) {
      console.error('Error fetching health card data:', error);
      setErrorDetails(
        error.response?.data?.message || 
        error.message || 
        "An unexpected error occurred while fetching medical records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    const fetchDoctors = async () => {
      try {
        const res = await doctorApi.list();
        if (res && res.data && res.data.data && res.data.data.length > 0) {
          setDoctorsList(res.data.data);
        } else {
          setDoctorsList([
            { _id: '000000000000000000000001', name: 'Alex House', specialization: 'Cardiology' },
            { _id: '000000000000000000000002', name: 'Sarah Connor', specialization: 'Neurology' },
            { _id: '000000000000000000000003', name: 'James Carter', specialization: 'General Physician' }
          ]);
        }
      } catch (err) {
        console.error("Failed to load doctors", err);
        setDoctorsList([
          { _id: '000000000000000000000001', name: 'Alex House', specialization: 'Cardiology' },
          { _id: '000000000000000000000002', name: 'Sarah Connor', specialization: 'Neurology' },
          { _id: '000000000000000000000003', name: 'James Carter', specialization: 'General Physician' }
        ]);
      }
    };
    fetchDoctors();
  }, [id]);

  const handleStartConsultation = async () => {
    if (!activeVisit) return;
    setSavingVisit(true);
    try {
      await visitApi.updateStatus(activeVisit._id, 'in_consultation');
      toast.success("Consultation started!");
      await fetchPatientData();
    } catch (err) {
      toast.error("Failed to start consultation.");
    } finally {
      setSavingVisit(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!activeVisit) return;
    setSavingVisit(true);
    try {
      await visitApi.updateDetails(activeVisit._id, { symptoms, diagnosis, notes, prescription });
      toast.success("Clinical summary saved successfully!");
      await fetchPatientData();
    } catch (err) {
      toast.error("Failed to save clinical details.");
    } finally {
      setSavingVisit(false);
    }
  };

  const handleCompleteVisit = async () => {
    if (!activeVisit) return;
    setSavingVisit(true);
    try {
      await visitApi.updateDetails(activeVisit._id, { symptoms, diagnosis, notes, prescription });
      await visitApi.updateStatus(activeVisit._id, 'completed');
      toast.success("Visit marked as Completed!");
      setActiveVisit(null);
      setSymptoms('');
      setDiagnosis('');
      setNotes('');
      setPrescription('');
      await fetchPatientData();
    } catch (err) {
      toast.error("Failed to complete visit.");
    } finally {
      setSavingVisit(false);
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!checkInDoctorId) {
      toast.error("Please assign a doctor.");
      return;
    }
    setSavingVisit(true);
    try {
      await visitApi.create({
        patientId: id,
        doctorId: checkInDoctorId,
        symptoms: checkInSymptoms,
        status: 'waiting'
      });
      toast.success("Patient checked-in successfully!");
      setShowCheckInModal(false);
      setCheckInSymptoms('');
      setCheckInDoctorId('');
      await fetchPatientData();
    } catch (err) {
      toast.error("Check-in failed.");
    } finally {
      setSavingVisit(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="h-[80vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-aayu-emerald/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-aayu-emerald border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-medium tracking-widest uppercase text-xs animate-pulse">
              Synchronizing Medical Records...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <div className="h-[80vh] flex flex-col items-center justify-center text-center">
          <div className="p-6 bg-red-500/10 rounded-full text-red-400 mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Patient Not Found</h2>
          <p className="text-slate-400 mb-4">The record you are looking for does not exist in our system.</p>
          {errorDetails && (
            <p className="text-red-400/80 text-xs bg-red-500/[0.05] border border-red-500/20 px-4 py-2.5 rounded-xl mb-8 max-w-md font-mono">
              Diagnostic Error: {errorDetails}
            </p>
          )}
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-20"
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Patient Profile</h2>
              <p className="text-white font-semibold">Medical Record ID: {patient._id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Report
            </Button>
            <Button className="gap-2" onClick={() => setShowCheckInModal(true)}>
              <Plus className="w-4 h-4" />
              New Visit
            </Button>
          </div>
        </div>

        {/* Premium Patient Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Card className="p-0 overflow-hidden border-aayu-emerald/30 bg-gradient-to-r from-aayu-navy to-aayu-surface">
            <div className="absolute top-0 right-0 w-96 h-96 bg-aayu-emerald/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/4" />
            
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-aayu-emerald to-aayu-cyan p-1.5 shadow-2xl shadow-aayu-emerald/30 group-hover:rotate-3 transition-transform duration-300">
                  <div className="w-full h-full rounded-[22px] bg-aayu-navy-deep flex items-center justify-center text-6xl font-bold text-white">
                    {patient.fullName ? patient.fullName[0] : ''}
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 p-3 bg-aayu-emerald rounded-2xl text-white shadow-lg shadow-aayu-emerald/40">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-6">
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-5xl font-extrabold text-white tracking-tight mb-2"
                  >
                    {patient.fullName}
                  </motion.h1>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge variant="default">{patient.age} Years</Badge>
                    <Badge variant="default">{patient.gender}</Badge>
                    <Badge variant="success">{patient.bloodGroup || 'N/A'}</Badge>
                    {patient.abhaId && <Badge variant="ai">{patient.abhaId}</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-medium text-slate-300">{patient.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-medium text-slate-300">{patient.address || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-aayu-emerald rounded-full" />
                      <p className="text-sm font-medium text-slate-300">Active Patient</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health Score</p>
                    <p className="text-sm font-bold text-aayu-emerald">84% Optimal</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tactical Intel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/[0.05] transition-colors">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Critical Allergies</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {patient.allergies && patient.allergies.length > 0 
                ? patient.allergies.join(', ') 
                : 'No known allergies reported in system.'}
            </p>
          </Card>

          <Card className="group border-aayu-saffron/20 bg-aayu-saffron/[0.02] hover:bg-aayu-saffron/[0.05] transition-colors">
            <div className="flex items-center gap-3 text-aayu-saffron mb-4">
              <div className="p-2 bg-aayu-saffron/20 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Chronic Conditions</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {patient.chronicDiseases && patient.chronicDiseases.length > 0 
                ? patient.chronicDiseases.join(', ') 
                : 'No chronic conditions listed currently.'}
            </p>
          </Card>

          <Card className="group border-aayu-emerald/20 bg-aayu-emerald/[0.02] hover:bg-aayu-emerald/[0.05] transition-colors">
            <div className="flex items-center gap-3 text-aayu-emerald mb-4">
              <div className="p-2 bg-aayu-emerald/20 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">AI Health Index</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-4xl font-black text-white">
                84<span className="text-xs text-slate-500 ml-1">/100</span>
              </div>
              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '84%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-aayu-emerald to-aayu-cyan rounded-full" 
                />
              </div>
            </div>
          </Card>
        </div>        
        {/* Active Consultation / Visit Lifecycle Control Center */}
        {activeVisit ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <Card className="border-aayu-cyan/30 bg-gradient-to-r from-slate-900 via-aayu-navy to-slate-900 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant={activeVisit.status === 'in_consultation' ? 'ai' : 'warning'} className="animate-pulse">
                  Active Visit: {activeVisit.status === 'in_consultation' ? 'In Consultation' : 'Waiting Lobby'}
                </Badge>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-aayu-cyan/15 rounded-2xl text-aayu-cyan shadow-inner">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Active Consultation Desk</h2>
                    <p className="text-xs text-slate-500 font-semibold">
                      Visit checked-in on {new Date(activeVisit.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <hr className="border-white/5" />

                {activeVisit.status === 'waiting' ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                    <div className="p-4 bg-aayu-saffron/10 text-aayu-saffron rounded-full">
                      <Clock className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Patient is in the Waiting Lobby</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      This patient was checked in by Reception. Start the medical consultation to log biometrics and symptoms.
                    </p>
                    <Button 
                      onClick={handleStartConsultation}
                      className="px-6 py-3.5 bg-aayu-cyan hover:bg-aayu-cyan/80 text-white font-black uppercase text-xs tracking-wider"
                    >
                      Start Medical Consultation
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveDetails} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Presenting Symptoms</label>
                        <textarea
                          rows="3"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium leading-relaxed"
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="e.g. Dry cough, chest pain, high fever for 3 days"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Primary Diagnosis</label>
                        <textarea
                          rows="3"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium leading-relaxed"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="e.g. Acute bronchitis, hyperthyroidism suspicion"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Medications Prescribed (Quick Summary / Direct links)</label>
                        <input
                          type="text"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium"
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                        />
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider ml-1">
                          Tip: Use the Prescription option in the sidebar to write full printable Rx slips.
                        </p>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clinical Notes & Instructions</label>
                        <textarea
                          rows="3"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium leading-relaxed"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Take medicine after food. Limit sugar. Complete rest for 3 days."
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 border-t border-white/5 pt-6">
                      <Button 
                        type="submit" 
                        variant="secondary"
                        disabled={savingVisit}
                        className="px-6 py-3.5 text-xs uppercase font-bold text-white hover:text-white"
                      >
                        {savingVisit ? 'Saving summary...' : 'Save Clinical Details'}
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleCompleteVisit}
                        disabled={savingVisit}
                        className="px-6 py-3.5 bg-aayu-emerald hover:bg-aayu-emerald-light text-white font-black uppercase text-xs tracking-wider"
                      >
                        Complete Consultation & Checkout
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="glass-card p-6 border-dashed border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-sm">No Active Consultation Session</h3>
              <p className="text-xs text-slate-500 font-semibold">Start a new visit or check-in to begin consultation records.</p>
            </div>
            <Button 
              onClick={() => setShowCheckInModal(true)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-xs font-bold uppercase text-slate-300 hover:text-white"
            >
              Check-In Patient
            </Button>
          </div>
        )}

        {/* Content Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Clinical Insight Engine */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-aayu-cyan" />
                AI Clinical Insight
              </h2>
              <Badge variant="ai">Engine V2.1</Badge>
            </div>
            <Card className="bg-gradient-to-b from-aayu-cyan/10 to-transparent border-aayu-cyan/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 bg-aayu-cyan rounded-full animate-ping" />
              </div>
              <div className="space-y-6">
                <div className="p-5 bg-aayu-navy-deep/50 rounded-2xl border border-white/10 relative">
                  <div className="absolute -top-3 -left-3 px-2 py-1 bg-aayu-cyan text-[10px] font-bold text-white rounded-md uppercase">
                    AI Summary
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic font-medium">
                    "Patient shows a stable recovery pattern. However, recent reports indicate a slight increase in HbA1c levels. Recommend reviewing medication for Type 2 Diabetes."
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Clinical Recommendations
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Review Metformin dosage adequacy",
                      "Schedule fasting blood sugar test",
                      "Monitor blood pressure bi-weekly"
                    ].map((rec, i) => (
                      <motion.li 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-start gap-3 text-sm text-slate-300 group/item"
                      >
                        <div className="w-1.5 h-1.5 bg-aayu-emerald rounded-full mt-1.5 group-hover/item:scale-150 transition-transform" />
                        <span className="group-hover/item:text-white transition-colors">{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                
              </div>
            </Card>
          </div>

          {/* Clinical Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-aayu-emerald" />
                Visit Timeline
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sort:</span>
                <select className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                  <option className="bg-aayu-navy">Newest First</option>
                  <option className="bg-aayu-navy">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-aayu-emerald/50 via-white/10 to-transparent" />

              {visits.length > 0 ? (
                visits.map((visit, idx) => (
                  <motion.div
                    key={visit._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-12"
                  >
                    <div className="absolute left-4 top-3 w-4 h-4 bg-aayu-navy-deep border-2 border-aayu-emerald rounded-full z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <Card className="p-5 hover:bg-white/5 cursor-pointer group transition-all border-white/5 hover:border-aayu-emerald/30">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white group-hover:text-aayu-emerald transition-colors text-lg">
                            {visit.diagnosis}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(visit.createdAt).toLocaleDateString()}
                            </span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                            <span className="flex items-center gap-1">
                              Dr. {visit.doctorName}
                            </span>
                          </div>
                        </div>
                        <Badge variant="default">{visit.status || 'Completed'}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 group-hover:text-aayu-emerald transition-colors">
                          <Pill className="w-4 h-4 text-aayu-emerald" />
                          Prescriptions
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 group-hover:text-aayu-emerald transition-colors">
                          <FileText className="w-4 h-4 text-aayu-cyan" />
                          Clinical Notes
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 group-hover:text-aayu-emerald transition-colors ml-auto">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 glass-card rounded-3xl border-dashed border-2 border-white/10">
                  <div className="inline-flex p-4 bg-white/5 rounded-full text-slate-500 mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-medium">No visit history recorded</p>
                  <p className="text-slate-600 text-sm">Start by adding a new clinical encounter</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---------------- CHECK-IN MODAL ---------------- */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl"
              onClick={() => setShowCheckInModal(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Clock className="text-aayu-cyan w-5.5 h-5.5 animate-pulse" />
                  Check-In Patient
                </h2>
                <button 
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
                  onClick={() => setShowCheckInModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCheckInSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assign Doctor</label>
                  <select
                    required
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium cursor-pointer"
                    value={checkInDoctorId}
                    onChange={(e) => setCheckInDoctorId(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-white">Select Doctor...</option>
                    {doctorsList.map(doc => (
                      <option key={doc._id} value={doc._id} className="bg-slate-900 text-white">
                        Dr. {doc.name} ({doc.specialization || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Symptoms / Reason</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Hypertension review, checkup"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-semibold"
                    value={checkInSymptoms}
                    onChange={(e) => setCheckInSymptoms(e.target.value)}
                  />
                </div>

                <Button className="w-full py-3.5 bg-aayu-cyan hover:bg-aayu-cyan/85 font-black uppercase text-xs tracking-wider mt-4">
                  Check-In Patient
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartHealthCard;

