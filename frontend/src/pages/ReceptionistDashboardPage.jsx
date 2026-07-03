import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  UserPlus, 
  Search, 
  Plus, 
  X, 
  Check, 
  Edit, 
  AlertCircle,
  UserCheck, 
  Activity,
  HeartPulse,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { patientApi, visitApi, appointmentApi, doctorApi } from '../services/apiService';
import { toast } from 'react-hot-toast';

const ReceptionistDashboardPage = () => {
  // Tabs: 'dashboard', 'appointments', 'patients'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalPatientsToday: 0,
    waitingQueue: 0,
    activeConsultations: 0,
    completedVisits: 0
  });
  
  // Doctor Availability
  const [doctorsList, setDoctorsList] = useState([]);
  
  // Queue & Appointments state
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  
  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Selected entities
  const [selectedPatientForCheckIn, setSelectedPatientForCheckIn] = useState(null);
  const [checkInDoctorId, setCheckInDoctorId] = useState('');
  const [checkInSymptoms, setCheckInSymptoms] = useState('');
  
  // Onboarding Form States
  const [formStep, setFormStep] = useState(1);
  const [registerError, setRegisterError] = useState('');
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    abhaId: '',
    allergies: '',
    chronicDiseases: '',
    address: '',
    assignedDoctor: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Appointment Form States
  const [apptPatientSearch, setApptPatientSearch] = useState('');
  const [apptPatientResults, setApptPatientResults] = useState([]);
  const [searchingApptPatient, setSearchingApptPatient] = useState(false);
  const [selectedApptPatient, setSelectedApptPatient] = useState(null);
  const [apptDoctorId, setApptDoctorId] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptReason, setApptReason] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch metrics
      const statsRes = await visitApi.getTodayStats();
      setMetrics(statsRes.data.data);
      
      // 2. Fetch active queue
      const queueRes = await visitApi.getQueue();
      setQueue(queueRes.data.data || []);
      
      // 3. Fetch today's appointments
      const apptRes = await appointmentApi.getAll({ date: new Date().toISOString().split('T')[0] });
      setAppointments(apptRes.data.data || []);
      
      // 3.5. Fetch pending appointments
      const pendingApptRes = await appointmentApi.getAll({ status: "pending" });
      setPendingAppointments(pendingApptRes.data.data || []);
      
      // 4. Fetch registered doctors (No Mock Fallbacks)
      const docRes = await doctorApi.list().catch(() => null);
      if (docRes && docRes.data && docRes.data.data) {
        setDoctorsList(docRes.data.data);
      } else {
        setDoctorsList([]);
      }
    } catch (err) {
      console.error("Dashboard synchronization failed", err);
      toast.error("Telemetry link sync failed. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!showRegisterModal) {
      setRegisterError('');
    }
  }, [showRegisterModal]);

  const handlePatientSearch = async (val) => {
    setSearchQuery(val);
    if (!val) {
      setPatientResults([]);
      return;
    }
    setSearchingPatient(true);
    try {
      const res = await patientApi.search(val);
      setPatientResults(res.data.data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleApptPatientSearch = async (val) => {
    setApptPatientSearch(val);
    if (!val) {
      setApptPatientResults([]);
      return;
    }
    setSearchingApptPatient(true);
    try {
      const res = await patientApi.search(val);
      setApptPatientResults(res.data.data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingApptPatient(false);
    }
  };

  const handlePatientCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedPatientForCheckIn) {
      toast.error("Please select a patient.");
      return;
    }
    if (!checkInDoctorId) {
      toast.error("Please assign a Doctor.");
      return;
    }

    try {
      const payload = {
        patientId: selectedPatientForCheckIn._id,
        doctorId: checkInDoctorId,
        symptoms: checkInSymptoms,
        status: 'waiting'
      };
      await visitApi.create(payload);
      toast.success(`${selectedPatientForCheckIn.fullName} checked-in successfully!`);
      setShowCheckInModal(false);
      setSelectedPatientForCheckIn(null);
      setCheckInSymptoms('');
      setCheckInDoctorId('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Check-In failed.");
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!selectedApptPatient) {
      toast.error("Select a patient.");
      return;
    }
    if (!apptDoctorId) {
      toast.error("Select a Doctor.");
      return;
    }
    if (!apptDate) {
      toast.error("Select Appointment Date.");
      return;
    }
    if (!apptReason || apptReason.trim() === "") {
      toast.error("Please enter a reason for the visit.");
      return;
    }

    try {
      const payload = {
        patientId: selectedApptPatient._id,
        doctorId: apptDoctorId,
        appointmentDate: apptDate,
        reason: apptReason,
        notes: apptNotes
      };
      await appointmentApi.create(payload);
      toast.success("Appointment booked successfully!");
      setShowApptModal(false);
      setSelectedApptPatient(null);
      setApptPatientSearch('');
      setApptDoctorId('');
      setApptDate('');
      setApptReason('');
      setApptNotes('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Booking failed.");
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setRegisterError('');
    try {
      const payload = {
        ...patientForm,
        phone: patientForm.phone.replace(/[\s\-\(\)]/g, ''),
        allergies: patientForm.allergies ? patientForm.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        chronicDiseases: patientForm.chronicDiseases ? patientForm.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      const res = await patientApi.create(payload);
      toast.success("New patient onboarding completed!");
      setShowRegisterModal(false);
      
      // Reset form
      setPatientForm({
        fullName: '',
        phone: '',
        age: '',
        gender: 'Male',
        bloodGroup: 'O+',
        abhaId: '',
        allergies: '',
        chronicDiseases: '',
        address: '',
        assignedDoctor: ''
      });
      setFormStep(1);
      
      // Auto open check-in modal for this patient!
      setSelectedPatientForCheckIn(res.data.data);
      setShowCheckInModal(true);
      
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      let errMsg = err.response?.data?.message || "Registration failed.";
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorDetails = err.response.data.errors.map(e => Object.values(e)[0]).filter(Boolean).join(", ");
        if (errorDetails) {
          errMsg = `${errMsg}: ${errorDetails}`;
        }
      }
      setRegisterError(errMsg);
      toast.error(errMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const updateQueueStatus = async (visitId, nextStatus) => {
    try {
      await visitApi.updateStatus(visitId, nextStatus);
      toast.success(`Queue status updated to ${nextStatus}!`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to transition queue status.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-aayu-emerald animate-spin-slow" />
            Workspace Desk Terminal
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Receptionist <span className="text-aayu-emerald">Desk</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Onboard patients, arrange doctor bookings, check-in visits, and supervise the clinic lobby.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowRegisterModal(true)}
            className="bg-aayu-emerald hover:bg-aayu-emerald-light px-5 py-3.5 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </Button>
          <Button 
            onClick={() => setShowApptModal(true)}
            className="bg-aayu-cyan hover:bg-aayu-cyan/80 px-5 py-3.5 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        {['dashboard', 'appointments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-aayu-emerald text-aayu-emerald font-black scale-105' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'dashboard' ? '🏥 Desk & Queue Board' : '📅 Appointment Scheduler'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Patients Registered Today", value: metrics.totalPatientsToday, icon: Users, color: "text-aayu-cyan", glow: "shadow-aayu-cyan/5" },
              { label: "Lobby Waiting Queue", value: metrics.waitingQueue, icon: Clock, color: "text-aayu-saffron", glow: "shadow-aayu-saffron/5" },
              { label: "Active Consultations", value: metrics.activeConsultations, icon: Activity, color: "text-aayu-emerald", glow: "shadow-aayu-emerald/5" },
              { label: "Completed Encounters", value: metrics.completedVisits, icon: CheckCircle, color: "text-purple-400", glow: "shadow-purple-500/5" }
            ].map((stat, idx) => (
              <Card key={idx} className={`p-6 border-white/5 hover:border-white/15 transition-all ${stat.glow}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
                  </div>
                  <div className={`p-3 bg-white/[0.02] rounded-2xl ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Queue Board */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-emerald pl-2">
                  Lobby Visit Queue
                </h2>
                <Badge variant="ai">Live Sync</Badge>
              </div>

              <Card className="p-0 border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="p-5">Patient Detail</th>
                        <th className="p-5">Assigned Clinician</th>
                        <th className="p-5">Registered Since</th>
                        <th className="p-5">Biometric Status</th>
                        <th className="p-5 text-right">Lobby Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                      {loading ? (
                        Array(3).fill(0).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="p-5"><Skeleton className="h-10 w-24" /></td>
                            <td className="p-5"><Skeleton className="h-10 w-20" /></td>
                            <td className="p-5"><Skeleton className="h-10 w-16" /></td>
                            <td className="p-5"><Skeleton className="h-6 w-12" /></td>
                            <td className="p-5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                          </tr>
                        ))
                      ) : queue.length > 0 ? (
                        queue.map((visit) => (
                          <tr key={visit._id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-5 font-bold text-white flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-aayu-emerald/10 text-aayu-emerald flex items-center justify-center font-bold">
                                {visit.patientId?.fullName ? visit.patientId.fullName[0] : 'P'}
                              </div>
                              <div>
                                <h4 className="leading-tight">{visit.patientId?.fullName}</h4>
                                <span className="text-[10px] text-slate-500 font-semibold">{visit.patientId?.phone}</span>
                              </div>
                            </td>
                            <td className="p-5 font-bold text-white">
                              Dr. {visit.doctorId?.name || 'Assigned'}
                              <p className="text-[9px] text-slate-500 font-medium">{visit.doctorId?.specialization || 'Resident'}</p>
                            </td>
                            <td className="p-5 text-slate-400 font-bold">
                              {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-5">
                              <Badge 
                                variant={
                                  visit.status === 'completed' ? 'success' :
                                  visit.status === 'in_consultation' ? 'ai' : 'warning'
                                }
                              >
                                {visit.status === 'in_consultation' ? 'Consulting' : visit.status}
                              </Badge>
                            </td>
                            <td className="p-5 text-right space-x-2">
                              {visit.status === 'waiting' && (
                                <Button 
                                  variant="secondary"
                                  onClick={() => updateQueueStatus(visit._id, 'in_consultation')}
                                  className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-3"
                                >
                                  Consult Doctor
                                </Button>
                              )}
                              {visit.status === 'in_consultation' && (
                                <Button 
                                  onClick={() => updateQueueStatus(visit._id, 'completed')}
                                  className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-aayu-emerald hover:bg-aayu-emerald/80"
                                >
                                  Complete
                                </Button>
                              )}
                              {visit.status !== 'completed' && (
                                <Button 
                                  variant="ghost"
                                  onClick={() => updateQueueStatus(visit._id, 'cancelled')}
                                  className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-2.5 text-red-400 hover:bg-red-500/10"
                                >
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-20">
                            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-300 font-bold text-base"> Lobbby queue is empty</p>
                            <p className="text-slate-500 text-xs mt-1">Start by searching a patient to Trigger Check-In below.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Quick Check-In Side Panel */}
            <div className="lg:col-span-4 space-y-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-cyan pl-2">
                Quick Patient Check-In
              </h2>

              <Card className="p-6 border-white/5 space-y-6 relative overflow-hidden bg-gradient-to-b from-aayu-cyan/[0.02] to-transparent">
                <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-cyan/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Search patients by Name or Phone to quickly check them into the doctor waiting lobby.
                  </p>
                  
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-aayu-cyan transition-colors" />
                    <input 
                      type="text"
                      placeholder="Type patient details..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium"
                      value={searchQuery}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {searchingPatient ? (
                    <Skeleton className="h-10 w-full" />
                  ) : patientResults.length > 0 ? (
                    patientResults.map(p => (
                      <div 
                        key={p._id}
                        onClick={() => {
                          setSelectedPatientForCheckIn(p);
                          setShowCheckInModal(true);
                          setSearchQuery('');
                          setPatientResults([]);
                        }}
                        className="p-3 bg-white/[0.01] hover:bg-aayu-cyan/10 border border-white/5 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-aayu-cyan transition-colors">{p.fullName}</h4>
                          <span className="text-[9px] text-slate-500 font-semibold">{p.phone}</span>
                        </div>
                        <Badge variant="success" className="py-0.5 text-[8px]">Link</Badge>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider py-4">No patients matched.</p>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* APPOINTMENTS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Pending Approvals Section */}
          <div className="lg:col-span-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-aayu-saffron uppercase tracking-widest border-l-2 border-aayu-saffron pl-2">
                Pending Patient Bookings (Requires Approval)
              </h2>
              {pendingAppointments.length > 0 && (
                <Badge variant="warning">{pendingAppointments.length} Pending</Badge>
              )}
            </div>

            <Card className="p-0 border-white/5 overflow-hidden shadow-2xl bg-gradient-to-r from-aayu-saffron/[0.02] to-transparent">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="p-5">Patient Detail</th>
                      <th className="p-5">Assigned Clinician</th>
                      <th className="p-5">Preferred Date & Time</th>
                      <th className="p-5">Reason</th>
                      <th className="p-5 text-right">Approval Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="p-5 text-center"><Skeleton className="h-10 w-full" /></td>
                      </tr>
                    ) : pendingAppointments.length > 0 ? (
                      pendingAppointments.map((appt) => (
                        <tr key={appt._id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-aayu-saffron/10 text-aayu-saffron flex items-center justify-center font-bold">
                              {appt.patientId?.fullName ? appt.patientId.fullName[0] : 'P'}
                            </div>
                            <div>
                              <h4 className="leading-tight">{appt.patientId?.fullName}</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">{appt.patientId?.phone}</span>
                            </div>
                          </td>
                          <td className="p-5 font-bold text-white">
                            Dr. {appt.doctorId?.name}
                            <p className="text-[9px] text-slate-500 font-medium">{appt.doctorId?.specialization}</p>
                          </td>
                          <td className="p-5 text-slate-400 font-bold">
                            {new Date(appt.appointmentDate).toLocaleDateString()} • {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-5 text-xs text-slate-400 max-w-xs truncate">
                            {appt.reason}
                          </td>
                          <td className="p-5 text-right space-x-2">
                            <Button 
                              onClick={async () => {
                                try {
                                  await appointmentApi.updateStatus(appt._id, 'scheduled');
                                  toast.success("Appointment approved and scheduled!");
                                  fetchDashboardData();
                                } catch (err) {
                                  toast.error("Failed to approve appointment.");
                                }
                              }}
                              className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-aayu-emerald hover:bg-aayu-emerald/80"
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await appointmentApi.updateStatus(appt._id, 'cancelled');
                                  toast.success("Appointment rejected.");
                                  fetchDashboardData();
                                } catch (err) {
                                  toast.error("Failed to cancel.");
                                }
                              }}
                              className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-2.5 text-red-400 hover:bg-red-500/10"
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          No pending appointments requiring approval
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Confirmed Scheduler List */}
          <div className="lg:col-span-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-emerald pl-2">
                Today's Doctor Bookings
              </h2>
            </div>

            <Card className="p-0 border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="p-5">Patient</th>
                      <th className="p-5">Assigned Doctor</th>
                      <th className="p-5">Booking Time</th>
                      <th className="p-5">Reason</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-5"><Skeleton className="h-10 w-24" /></td>
                          <td className="p-5"><Skeleton className="h-10 w-20" /></td>
                          <td className="p-5"><Skeleton className="h-10 w-16" /></td>
                          <td className="p-5"><Skeleton className="h-6 w-12" /></td>
                          <td className="p-5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : appointments.length > 0 ? (
                      appointments.map((appt) => (
                        <tr key={appt._id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-aayu-cyan/10 text-aayu-cyan flex items-center justify-center font-bold">
                              {appt.patientId?.fullName ? appt.patientId.fullName[0] : 'P'}
                            </div>
                            <div>
                              <h4 className="leading-tight">{appt.patientId?.fullName}</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">{appt.patientId?.phone}</span>
                            </div>
                          </td>
                          <td className="p-5 font-bold text-white">
                            Dr. {appt.doctorId?.name}
                            <p className="text-[9px] text-slate-500 font-medium">{appt.doctorId?.specialization}</p>
                          </td>
                          <td className="p-5 text-slate-400 font-bold">
                            {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-5 text-xs text-slate-400 max-w-xs truncate">
                            {appt.reason}
                          </td>
                          <td className="p-5">
                            <Badge 
                              variant={
                                appt.status === 'completed' ? 'success' :
                                appt.status === 'cancelled' ? 'danger' : 'warning'
                              }
                            >
                              {appt.status}
                            </Badge>
                          </td>
                          <td className="p-5 text-right space-x-2">
                            {appt.status === 'scheduled' && (
                              <>
                                <Button 
                                  onClick={async () => {
                                    try {
                                      // Check-in from appt directly
                                      const visitPayload = {
                                        patientId: appt.patientId._id,
                                        doctorId: appt.doctorId._id,
                                        symptoms: appt.reason,
                                        status: 'waiting'
                                      };
                                      await visitApi.create(visitPayload);
                                      await appointmentApi.updateStatus(appt._id, 'completed');
                                      toast.success("Patient checked-in successfully!");
                                      fetchDashboardData();
                                    } catch (err) {
                                      toast.error("Check-in failed.");
                                    }
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-aayu-emerald hover:bg-aayu-emerald/80"
                                >
                                  Check In Patient
                                </Button>
                                <Button 
                                  variant="ghost"
                                  onClick={async () => {
                                    try {
                                      await appointmentApi.updateStatus(appt._id, 'cancelled');
                                      toast.success("Appointment Cancelled.");
                                      fetchDashboardData();
                                    } catch (err) {
                                      toast.error("Failed to cancel.");
                                    }
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-2.5 text-red-400 hover:bg-red-500/10"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-20">
                          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-300 font-bold text-base">No doctor bookings for today</p>
                          <p className="text-slate-500 text-xs mt-1">Click "Book Appointment" above to create one.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ---------------- CHECK-IN MODAL ---------------- */}
      <AnimatePresence>
        {showCheckInModal && selectedPatientForCheckIn && (
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

              <form onSubmit={handlePatientCheckIn} className="space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-wider">Onboarding Patient</p>
                  <h4 className="text-sm font-bold text-white">{selectedPatientForCheckIn.fullName}</h4>
                  <p className="text-slate-400 font-medium">{selectedPatientForCheckIn.phone} • {selectedPatientForCheckIn.age} yrs</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assign Clinician</label>
                  <select
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium cursor-pointer"
                    value={checkInDoctorId}
                    onChange={(e) => setCheckInDoctorId(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-white">Select Doctor...</option>
                    {doctorsList.map(doc => (
                      <option key={doc._id} value={doc._id} className="bg-slate-900 text-white">Dr. {doc.name} ({doc.specialization})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Presenting Symptoms / Reason</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Chest congestion, routine checkup"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-semibold"
                    value={checkInSymptoms}
                    onChange={(e) => setCheckInSymptoms(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full py-3.5 bg-aayu-cyan hover:bg-aayu-cyan/85 font-black uppercase text-xs tracking-wider mt-4">
                  Confirm Check-In
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- BOOK APPOINTMENT MODAL ---------------- */}
      <AnimatePresence>
        {showApptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl"
              onClick={() => setShowApptModal(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Calendar className="text-aayu-cyan w-5.5 h-5.5" />
                  Schedule Appointment
                </h2>
                <button 
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
                  onClick={() => setShowApptModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                {/* Search Patient */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Patient</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="Type patient name..."
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium"
                      value={selectedApptPatient ? selectedApptPatient.fullName : apptPatientSearch}
                      onChange={(e) => {
                        handleApptPatientSearch(e.target.value);
                        setSelectedApptPatient(null);
                      }}
                    />
                  </div>

                  {searchingApptPatient ? (
                    <div className="absolute w-full mt-1 bg-slate-900 border border-white/10 rounded-xl p-3 z-50 text-center text-xs text-slate-400">
                      Searching patients...
                    </div>
                  ) : apptPatientResults.length > 0 && !selectedApptPatient ? (
                    <div className="absolute w-full mt-1 bg-slate-900 border border-white/10 rounded-xl max-h-36 overflow-y-auto z-50 shadow-2xl">
                      {apptPatientResults.map(p => (
                        <div 
                          key={p._id}
                          onClick={() => {
                            setSelectedApptPatient(p);
                            setApptPatientResults([]);
                          }}
                          className="px-4 py-2.5 hover:bg-aayu-cyan/15 cursor-pointer text-xs font-semibold flex justify-between"
                        >
                          <span className="text-white">{p.fullName}</span>
                          <span className="text-slate-500">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  ) : apptPatientSearch && !selectedApptPatient ? (
                    <div className="absolute w-full mt-1 bg-slate-900 border border-white/10 rounded-xl p-3 z-50 text-center text-xs text-slate-500 uppercase font-bold tracking-wider">
                      No patients matched
                    </div>
                  ) : null}
                </div>

                {/* Doctor */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assign Clinician</label>
                  <select
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium cursor-pointer"
                    value={apptDoctorId}
                    onChange={(e) => setApptDoctorId(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-white">Select Doctor...</option>
                    {doctorsList.map(doc => (
                      <option key={doc._id} value={doc._id} className="bg-slate-900 text-white">Dr. {doc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date & Time</label>
                  <input 
                    type="datetime-local"
                    required
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-semibold cursor-pointer"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reason for Visit</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Hypertension follow-up"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-cyan/50 font-semibold"
                    value={apptReason}
                    onChange={(e) => setApptReason(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full py-3.5 bg-aayu-cyan hover:bg-aayu-cyan/85 font-black uppercase text-xs tracking-wider mt-4">
                  Schedule Booking
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- REGISTER PATIENT MODAL ---------------- */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl"
              onClick={() => setShowRegisterModal(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl glass-card border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <UserPlus className="text-aayu-emerald w-5.5 h-5.5" />
                  Onboard Biometric Patient
                </h2>
                <button 
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
                  onClick={() => setShowRegisterModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterPatient} className="space-y-4">
                
                {formStep === 1 ? (
                  /* Step 1: Core Bio */
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-aayu-emerald uppercase tracking-widest mb-2">Step 1 of 2: Demographics</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input 
                          type="text" required placeholder="Jane Doe"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.fullName}
                          onChange={(e) => setPatientForm({...patientForm, fullName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input 
                          type="text" required placeholder="+91 98765 43210"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.phone}
                          onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Age</label>
                        <input 
                          type="number" required placeholder="32"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.age}
                          onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                        <select
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-medium cursor-pointer"
                          value={patientForm.gender}
                          onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                        >
                          <option value="Male" className="bg-slate-900 text-white">Male</option>
                          <option value="Female" className="bg-slate-900 text-white">Female</option>
                          <option value="Other" className="bg-slate-900 text-white">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
                        <select
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-medium cursor-pointer"
                          value={patientForm.bloodGroup}
                          onChange={(e) => setPatientForm({...patientForm, bloodGroup: e.target.value})}
                        >
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                            <option key={bg} value={bg} className="bg-slate-900 text-white">{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Doctor</label>
                        <select
                          required
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-medium cursor-pointer"
                          value={patientForm.assignedDoctor}
                          onChange={(e) => setPatientForm({...patientForm, assignedDoctor: e.target.value})}
                        >
                          <option value="" className="bg-slate-900 text-white">Select Doctor...</option>
                          {doctorsList.map(doc => (
                            <option key={doc._id} value={doc._id} className="bg-slate-900 text-white">Dr. {doc.name} ({doc.specialization})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={() => {
                        if (!patientForm.fullName || !patientForm.phone || !patientForm.age || !patientForm.assignedDoctor) {
                          toast.error("Please fill in core demographics and assign a doctor first.");
                          return;
                        }
                        setFormStep(2);
                      }}
                      className="w-full py-3.5 bg-aayu-emerald hover:bg-aayu-emerald/80 font-black uppercase text-xs tracking-wider"
                    >
                      Next Step
                    </Button>
                  </div>
                ) : (
                  /* Step 2: Medical Data */
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-aayu-emerald uppercase tracking-widest mb-2">Step 2 of 2: Medical Parameters</div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ABHA ID (Government Card)</label>
                        <input 
                          type="text" placeholder="12-3456-7890-12"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.abhaId}
                          onChange={(e) => setPatientForm({...patientForm, abhaId: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Known Allergies (Comma separated)</label>
                        <input 
                          type="text" placeholder="Peanuts, Penicillin"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.allergies}
                          onChange={(e) => setPatientForm({...patientForm, allergies: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chronic Illnesses (Comma separated)</label>
                        <input 
                          type="text" placeholder="Hypertension, Diabetes Type 2"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.chronicDiseases}
                          onChange={(e) => setPatientForm({...patientForm, chronicDiseases: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                        <input 
                          type="text" placeholder="Flat 402, Emerald Towers, New Delhi"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-aayu-emerald/50 font-semibold"
                          value={patientForm.address}
                          onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                        />
                      </div>
                    </div>

                    {registerError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold mb-4"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {registerError}
                      </motion.div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => setFormStep(1)}
                        className="flex-1 py-3.5 text-xs uppercase font-bold"
                      >
                        Demographics
                      </Button>
                      <Button 
                        type="submit"
                        disabled={formSubmitting}
                        className="flex-1 py-3.5 bg-aayu-emerald hover:bg-aayu-emerald/80 font-black uppercase text-xs tracking-wider"
                      >
                        {formSubmitting ? 'Submitting...' : 'Onboard Patient'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ReceptionistDashboardPage;
