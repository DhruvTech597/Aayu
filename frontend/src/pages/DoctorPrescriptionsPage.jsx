import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  X, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Activity,
  HeartPulse,
  Calendar,
  User,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { prescriptionApi, patientApi } from '../services/apiService';
import { toast } from 'react-hot-toast';

const DoctorPrescriptionsPage = () => {
  // Lists & Filtering
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal displays
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Search Patients (For creating prescription)
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('scheduled');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [page, statusFilter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Find logged in doctor's prescriptions or fetch general lists with pagination
      const res = await prescriptionApi.getByPatient('all', {
        page,
        limit: 10,
        status: statusFilter
      });
      // Fallback if 'all' route maps differently or fetch directly:
      // Note: We created generic patient/doctor endpoints. Let's fetch clinic-wide prescriptions:
      setPrescriptions(res.data.data.prescriptions || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
      // Try fetching doctor specific if patient list is restricted
      try {
        const docRes = await prescriptionApi.getByDoctor('me', { page, limit: 10, status: statusFilter });
        setPrescriptions(docRes.data.data.prescriptions || []);
        setTotalPages(docRes.data.data.totalPages || 1);
        setTotal(docRes.data.data.total || 0);
      } catch (innerErr) {
        console.error('Failed both prescription attempts', innerErr);
        toast.error('Failed to fetch prescription archives.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSearch = async (val) => {
    setPatientSearch(val);
    if (!val) {
      setPatients([]);
      return;
    }
    try {
      const res = await patientApi.search(val);
      setPatients(res.data.data.patients || []);
    } catch (err) {
      console.error('Patient search failed', err);
    }
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedicineRow = (index) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = medicines.map((m, idx) => {
      if (idx === index) {
        return { ...m, [field]: value };
      }
      return m;
    });
    setMedicines(updated);
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }
    if (medicines.some(m => !m.name)) {
      toast.error('Each medicine row requires a name.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        symptoms,
        diagnosis,
        medicines,
        notes,
        followUpDate: followUpDate || undefined,
        followUpStatus
      };
      await prescriptionApi.create(payload);
      toast.success('Clinical prescription created successfully!');
      setShowCreateModal(false);
      
      // Reset form
      setSelectedPatient(null);
      setPatientSearch('');
      setSymptoms('');
      setDiagnosis('');
      setNotes('');
      setFollowUpDate('');
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
      
      fetchPrescriptions();
    } catch (err) {
      console.error('Create prescription failed', err);
      toast.error(err.response?.data?.message || 'Failed to submit prescription.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      {/* Top Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-cyan font-bold text-xs uppercase tracking-widest">
            <HeartPulse className="w-4 h-4 text-aayu-cyan animate-pulse" />
            Clinical Prescription Engine
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Prescription <span className="text-aayu-cyan">Records</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Generate and manage digitised, audit-ready patient prescriptions.
          </p>
        </div>

        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-aayu-cyan hover:bg-aayu-cyan/80 text-white shadow-lg shadow-aayu-cyan/20 px-6 py-4 rounded-2xl font-bold uppercase tracking-wider flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 self-start lg:self-center"
        >
          <Plus className="w-5 h-5" />
          Create Prescription
        </Button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-aayu-cyan transition-colors" />
          <input 
            type="text" 
            placeholder="Quick search prescription records..." 
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-medium placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { label: 'All', value: '' },
            { label: '📋 Scheduled', value: 'scheduled' },
            { label: '✅ Completed', value: 'completed' },
            { label: '⚠️ Missed', value: 'missed' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border whitespace-nowrap transition-all ${
                statusFilter === item.value 
                  ? 'bg-aayu-cyan/15 border-aayu-cyan/30 text-aayu-cyan shadow-md shadow-aayu-cyan/5' 
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prescription List Table */}
      <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-5">Patient Details</th>
                <th className="p-5">Diagnosis</th>
                <th className="p-5">Medications</th>
                <th className="p-5">Follow-Up Date</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-5"><Skeleton className="h-10 w-32" /></td>
                    <td className="p-5"><Skeleton className="h-10 w-24" /></td>
                    <td className="p-5"><Skeleton className="h-10 w-48" /></td>
                    <td className="p-5"><Skeleton className="h-10 w-24" /></td>
                    <td className="p-5"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : prescriptions.length > 0 ? (
                prescriptions.filter(p => 
                  p.patientId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((presc) => (
                  <tr 
                    key={presc._id}
                    className="hover:bg-white/[0.02] transition-colors group text-sm font-medium text-slate-300"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-aayu-cyan/10 text-aayu-cyan flex items-center justify-center font-bold text-xs">
                          {presc.patientId?.fullName ? presc.patientId.fullName[0] : 'P'}
                        </div>
                        <div>
                          <h4 className="font-bold text-white leading-tight">{presc.patientId?.fullName || 'Jane Doe'}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold">{presc.patientId?.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-xs font-semibold text-slate-400">
                      {presc.diagnosis || 'General Checkup'}
                    </td>
                    <td className="p-5 text-xs text-slate-300 max-w-xs truncate">
                      {presc.medicines?.map(m => `${m.name} (${m.dosage || 'N/A'})`).join(', ') || 'No medications listed'}
                    </td>
                    <td className="p-5 text-xs text-slate-400 font-bold">
                      {presc.followUpDate ? new Date(presc.followUpDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-5">
                      <Badge 
                        variant={
                          presc.followUpStatus === 'completed' ? 'success' : 
                          presc.followUpStatus === 'missed' ? 'danger' : 'warning'
                        }
                      >
                        {presc.followUpStatus || 'scheduled'}
                      </Badge>
                    </td>
                    <td className="p-5 text-right">
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedPrescription(presc)}
                        className="text-xs font-bold text-aayu-cyan group-hover:bg-aayu-cyan/15 group-hover:text-white inline-flex"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Rx
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-300 font-bold text-lg">No prescription records found</p>
                    <p className="text-slate-500 text-xs mt-1">Start by clicking "Create Prescription" above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 pt-4">
          <Button 
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="text-xs"
          >
            Prev
          </Button>
          <span className="flex items-center text-xs font-bold text-slate-400 px-4">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      )}

      {/* ---------------- CREATION MODAL ---------------- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl"
              onClick={() => !formSubmitting && setShowCreateModal(false)}
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-3xl glass-card border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Activity className="text-aayu-cyan w-6 h-6 animate-pulse" />
                  Issue Clinical Prescription (Rx)
                </h2>
                <button 
                  disabled={formSubmitting}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitPrescription} className="space-y-6">
                
                {/* 1. Patient Search & Select */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search & Select Patient</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="Type patient name, phone number, or abha ID..."
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all text-sm font-medium"
                      value={selectedPatient ? selectedPatient.fullName : patientSearch}
                      onChange={(e) => {
                        handlePatientSearch(e.target.value);
                        setSelectedPatient(null);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                    />
                    {selectedPatient && (
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setPatientSearch('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showPatientDropdown && patientSearch && !selectedPatient && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute w-full mt-2 bg-slate-900/95 border border-white/10 backdrop-blur-xl rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl"
                      >
                        {patients.length > 0 ? (
                          patients.map(patient => (
                            <div
                              key={patient._id}
                              className="px-4 py-3 hover:bg-aayu-cyan/10 cursor-pointer flex items-center justify-between border-b border-white/5 transition-colors text-xs font-semibold"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientDropdown(false);
                              }}
                            >
                              <span className="text-white">{patient.fullName}</span>
                              <span className="text-slate-500">{patient.phone}</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-4 text-center text-slate-500 text-xs font-semibold">
                            No patient matched in clinical database.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Symptoms & Diagnosis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Presenting Symptoms</label>
                    <input 
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-semibold"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g. Chest pain, Fatigue, High fever"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Diagnosis</label>
                    <input 
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-semibold"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Chronic Hypertension, Type 2 Diabetes"
                    />
                  </div>
                </div>

                {/* 3. Medications (Dynamic Row Creation) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Medications Panel</label>
                    <Button 
                      type="button" 
                      onClick={handleAddMedicineRow}
                      variant="outline"
                      className="text-[9px] font-bold uppercase tracking-wider py-1 px-3"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end p-4 bg-white/[0.01] border border-white/5 rounded-2xl relative">
                        <div className="col-span-4 space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Medicine Name</label>
                          <input 
                            type="text"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-cyan/50 font-semibold"
                            value={med.name}
                            onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Paracetamol"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dosage</label>
                          <input 
                            type="text"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-cyan/50"
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                            placeholder="500 mg"
                          />
                        </div>

                        <div className="col-span-3 space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Frequency</label>
                          <input 
                            type="text"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-cyan/50"
                            value={med.frequency}
                            onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                            placeholder="Twice a day"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Duration</label>
                          <input 
                            type="text"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-cyan/50"
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                            placeholder="5 days"
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            disabled={medicines.length === 1}
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl border border-red-500/10 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Notes & Follow-up Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clinical Instructions & Notes</label>
                    <input 
                      type="text"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-semibold"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Take medicine after food. Drink warm water."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Follow-Up Appointment</label>
                    <input 
                      type="date"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-semibold cursor-pointer"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  disabled={formSubmitting}
                  className="w-full py-4 bg-aayu-cyan hover:bg-aayu-cyan/80 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-aayu-cyan/20 mt-4"
                >
                  {formSubmitting ? 'Signing digital signature...' : 'Commit Prescription to Database'}
                </Button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- PRESCRIPTION DETAIL PRINT MODAL ---------------- */}
      <AnimatePresence>
        {selectedPrescription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl print:hidden"
              onClick={() => setSelectedPrescription(null)}
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10 max-h-[85vh] overflow-y-auto print:absolute print:inset-0 print:bg-white print:text-black print:max-h-full print:border-none print:shadow-none print:rounded-none"
            >
              
              {/* Header Action Tools */}
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 print:hidden">
                <span className="text-[10px] font-black text-aayu-cyan uppercase tracking-widest">Prescription Slip view</span>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={handlePrint} className="text-xs gap-1 py-2 font-bold uppercase">
                    Print Slip
                  </Button>
                  <a 
                    href={prescriptionApi.getPDFUrl(selectedPrescription._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-aayu-cyan hover:bg-aayu-cyan/80 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-102"
                  >
                    <FileDown className="w-4 h-4" /> Download PDF
                  </a>
                  <button onClick={() => setSelectedPrescription(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* The printable prescription panel */}
              <div className="space-y-8 print:text-black print:bg-white print:p-6">
                
                {/* Clinical Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-700/20 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white print:text-black tracking-tight uppercase">Aayu Clinic</h2>
                    <p className="text-xs font-semibold text-slate-500 print:text-slate-700">Digital Biometric Telemetry Network</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-white print:text-black">Dr. {selectedPrescription.doctorId?.name || 'Dr. Alex House'}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold print:text-slate-600">{selectedPrescription.doctorId?.specialization || 'General Practitioner'}</p>
                    <p className="text-[9px] text-slate-500 print:text-slate-600">{selectedPrescription.doctorId?.email}</p>
                  </div>
                </div>

                {/* Patient Biometrics Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-5 bg-white/[0.02] print:bg-slate-100 rounded-2xl border border-white/5 print:border-none text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-slate-600">Patient Name</p>
                    <h4 className="font-bold text-white print:text-black mt-0.5">{selectedPrescription.patientId?.fullName || 'Jane Doe'}</h4>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-slate-600">Age / Gender</p>
                    <h4 className="font-bold text-white print:text-black mt-0.5">{selectedPrescription.patientId?.age} yrs • {selectedPrescription.patientId?.gender}</h4>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-slate-600">Blood Type</p>
                    <h4 className="font-bold text-white print:text-black mt-0.5">{selectedPrescription.patientId?.bloodGroup || 'O+'}</h4>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider print:text-slate-600">Date Issued</p>
                    <h4 className="font-bold text-white print:text-black mt-0.5">{new Date(selectedPrescription.createdAt).toLocaleDateString()}</h4>
                  </div>
                </div>

                {/* Clinical Overview symptoms/diagnosis */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/5 print:border-slate-300 pb-1.5 print:text-slate-700">Presenting Symptoms</h4>
                    <p className="text-sm font-semibold text-slate-300 print:text-black pt-2">{selectedPrescription.symptoms || 'General Fatigue & muscle weakness'}</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/5 print:border-slate-300 pb-1.5 print:text-slate-700">Diagnosis</h4>
                    <p className="text-sm font-bold text-white print:text-black pt-2">{selectedPrescription.diagnosis || 'Cardiovascular hypertension'}</p>
                  </div>
                </div>

                {/* Medications Rx Table */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/5 print:border-slate-300 pb-1.5 print:text-slate-700">Rx Medications</h4>
                  
                  <div className="space-y-3 pt-2">
                    {selectedPrescription.medicines?.map((med, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-white/[0.01] print:bg-slate-50 border border-white/5 print:border-none rounded-xl">
                        <div>
                          <h4 className="text-xs font-bold text-white print:text-black uppercase">{med.name}</h4>
                          <span className="text-[10px] text-slate-500 print:text-slate-600 font-semibold">{med.dosage || 'N/A'} • {med.frequency}</span>
                        </div>
                        <span className="text-[10px] font-bold text-aayu-cyan print:text-slate-700 uppercase tracking-widest bg-aayu-cyan/10 print:bg-transparent px-2.5 py-1 rounded-lg">
                          {med.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions & Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5 print:border-slate-300">
                  <div>
                    <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest print:text-slate-700">Instructions / Notes</h5>
                    <p className="text-xs text-slate-400 print:text-black pt-1">{selectedPrescription.notes || 'No custom notes provided.'}</p>
                  </div>

                  <div className="text-right print:text-left md:text-right">
                    <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest print:text-slate-700">Follow-Up Date</h5>
                    <p className="text-xs font-bold text-aayu-cyan print:text-black pt-1">
                      {selectedPrescription.followUpDate ? new Date(selectedPrescription.followUpDate).toLocaleDateString() : 'No appointment scheduled'}
                    </p>
                  </div>
                </div>

                {/* Clinical Signature */}
                <div className="pt-10 flex justify-between items-end">
                  <div className="text-[10px] text-slate-500 print:text-slate-600 font-bold uppercase">
                    Audit ref: {selectedPrescription._id?.slice(-12).toUpperCase()}
                  </div>
                  <div className="text-center w-48 border-t border-white/10 print:border-slate-400 pt-3">
                    <p className="text-xs font-bold text-white print:text-black">Dr. {selectedPrescription.doctorId?.name}</p>
                    <p className="text-[9px] text-slate-500 print:text-slate-600 uppercase tracking-wider mt-0.5">Digitally Signed (Aayu OS)</p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DoctorPrescriptionsPage;
