import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Printer, 
  Download, 
  Clock, 
  SlidersHorizontal, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/CommonUI';
import { prescriptionApi } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const PatientPrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Prescription for detail display
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active'); // 'active', 'completed', 'expired'

  const fetchPrescriptions = async () => {
    if (!user?.patientId) return;
    try {
      setLoading(true);
      const res = await prescriptionApi.getByPatient(user.patientId, { limit: 50 });
      const list = res.data.data.prescriptions || [];
      setPrescriptions(list);
      if (list.length > 0) {
        setSelectedPrescription(list[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch clinical prescriptions list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  // Handle PDF Download
  const handlePrint = (id) => {
    const pdfUrl = prescriptionApi.getPDFUrl(id);
    window.open(pdfUrl, '_blank');
  };

  // Grouping Logics
  const getGroupedPrescriptions = () => {
    const now = new Date();
    return prescriptions.filter(p => {
      const followUp = p.followUpDate ? new Date(p.followUpDate) : null;
      
      if (activeFilter === 'active') {
        // Active if followUpStatus is scheduled and either no date or date is future
        return p.followUpStatus === 'scheduled' && (!followUp || followUp >= now);
      }
      if (activeFilter === 'completed') {
        // Completed if marked completed
        return p.followUpStatus === 'completed';
      }
      if (activeFilter === 'expired') {
        // Expired if marked missed, or if followUp date is in the past and still marked scheduled
        return p.followUpStatus === 'missed' || (p.followUpStatus === 'scheduled' && followUp && followUp < now);
      }
      return true;
    });
  };

  const filteredList = getGroupedPrescriptions();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-aayu-saffron font-bold text-xs uppercase tracking-widest">
          <Pill className="w-4 h-4 text-aayu-saffron" />
          Medication Registry
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Prescription <span className="text-aayu-saffron">Center</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">Verify active prescriptions, dosage frequencies, and clinician instruction notes.</p>
      </div>

      {/* Grouping Filters bar */}
      <div className="flex justify-center md:justify-start bg-white/[0.02] border border-white/5 p-1 rounded-2xl w-fit">
        {[
          { label: 'Active Medicines', value: 'active', color: 'text-aayu-emerald border-aayu-emerald/20 bg-aayu-emerald/5' },
          { label: 'Completed Courses', value: 'completed', color: 'text-aayu-cyan border-aayu-cyan/20 bg-aayu-cyan/5' },
          { label: 'Past / Expired', value: 'expired', color: 'text-slate-400 border-white/5 bg-white/5' }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => { setActiveFilter(filter.value); setSelectedReport(null); }}
            className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 border ${
              activeFilter === filter.value 
                ? filter.color 
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Layout Split: Prescriptions List (Left) and Detailed Rx Slip (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Prescriptions Directory List (Left) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prescription History</h3>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredList.length > 0 ? (
              filteredList.map((rx) => (
                <Card 
                  key={rx._id}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-all border-white/5 ${
                    selectedPrescription?._id === rx._id 
                      ? 'bg-aayu-saffron/5 border-aayu-saffron/20 shadow-inner' 
                      : 'hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                  onClick={() => setSelectedPrescription(rx)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${selectedPrescription?._id === rx._id ? 'bg-aayu-saffron/10 text-aayu-saffron' : 'bg-white/5 text-slate-400'}`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-snug">
                        Dr. {rx.doctorId?.name || 'Clinic Specialist'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(rx.createdAt).toLocaleDateString()} • {rx.medicines?.length || 0} Meds
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No prescriptions in category</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Rx Slip Inspector (Right) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedPrescription ? (
              <motion.div
                key={selectedPrescription._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-8 md:p-10 border-white/10 space-y-8 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white/[0.01] to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-saffron/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Rx Slip Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-aayu-saffron/15 rounded-2xl text-aayu-saffron">
                        <Pill className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Rx Clinical Slip</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Slip ID: {selectedPrescription._id.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button onClick={() => handlePrint(selectedPrescription._id)} className="gap-2 px-6 py-2.5 bg-aayu-saffron hover:bg-aayu-saffron/80 text-white shadow-lg shadow-aayu-saffron/20 font-black uppercase text-xs tracking-wider">
                        <Printer className="w-4 h-4" />
                        Print Rx Slip
                      </Button>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Prescribing Doctor</p>
                      <p className="text-base font-extrabold text-white">Dr. {selectedPrescription.doctorId?.name}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{selectedPrescription.doctorId?.specialization || 'Clinical Lead'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Consultation Date</p>
                      <p className="text-base font-extrabold text-white">{new Date(selectedPrescription.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                      <p className="text-xs text-slate-500 font-semibold">Time: {new Date(selectedPrescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {/* Synopsis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Reported Symptoms</p>
                      <p className="text-sm font-bold text-slate-300">{selectedPrescription.symptoms || 'General review & checkup'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Primary Diagnosis</p>
                      <p className="text-sm font-bold text-slate-300">{selectedPrescription.diagnosis || 'No primary diagnosis registered'}</p>
                    </div>
                  </div>

                  {/* Medications Grid */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prescribed Medications</h4>
                    
                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                      <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                        <div className="col-span-5">Medicine Name</div>
                        <div className="col-span-3">Dosage</div>
                        <div className="col-span-2">Frequency</div>
                        <div className="col-span-2 text-right">Duration</div>
                      </div>

                      <div className="divide-y divide-white/5">
                        {selectedPrescription.medicines && selectedPrescription.medicines.map((med, i) => (
                          <div key={i} className="grid grid-cols-12 gap-3 px-6 py-4 items-center text-sm font-semibold">
                            <div className="col-span-5 font-extrabold text-white">{med.name}</div>
                            <div className="col-span-3 text-slate-300 text-xs">{med.dosage || 'N/A'}</div>
                            <div className="col-span-2 text-slate-300 text-xs">{med.frequency || 'N/A'}</div>
                            <div className="col-span-2 text-right text-xs text-slate-400 font-bold">{med.duration || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Notes */}
                  {selectedPrescription.notes && (
                    <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-aayu-saffron" />
                        Clinical Instructions & Advice
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                        {selectedPrescription.notes}
                      </p>
                    </div>
                  )}

                  {/* Follow Up Date */}
                  {selectedPrescription.followUpDate && (
                    <div className="flex items-center justify-between p-4 bg-aayu-saffron/5 border border-aayu-saffron/10 rounded-xl">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-aayu-saffron" />
                        Scheduled Follow Up Appointment
                      </span>
                      <Badge variant="warning">
                        {new Date(selectedPrescription.followUpDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </Badge>
                    </div>
                  )}

                  {/* HIPAA Footer */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-aayu-emerald" />
                      HIPAA Compliant Digital Rx Slip
                    </span>
                    <span className="font-mono text-[9px]">Aayu OS Verification</span>
                  </div>

                </Card>
              </motion.div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-4">
                <Pill className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Select a prescription to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default PatientPrescriptionsPage;
