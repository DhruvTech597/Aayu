import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  FileText, 
  Sparkles, 
  Activity, 
  Clock, 
  User, 
  TrendingUp, 
  UserCheck, 
  CheckCircle, 
  Plus, 
  ChevronRight, 
  HeartPulse, 
  Edit3, 
  Save, 
  X,
  Stethoscope
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { doctorApi } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [availabilityHours, setAvailabilityHours] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getDashboard();
      setData(res.data.data);
      setError(null);

      // Populate edit fields
      const prof = res.data.data.profile;
      setName(prof.name || '');
      setSpecialization(prof.specialization || '');
      setAvailabilityDays(prof.availability?.days || []);
      setAvailabilityHours(prof.availability?.hours || '');
    } catch (err) {
      console.error('Failed to load doctor dashboard', err);
      setError('Could not connect to medical telemetry. Please verify clinical authorization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const updateData = {
        name,
        specialization,
        availability: {
          days: availabilityDays,
          hours: availabilityHours
        }
      };
      await doctorApi.updateProfile(updateData);
      toast.success('Clinical profile updated successfully!');
      setEditingProfile(false);
      fetchDashboard();
    } catch (err) {
      console.error('Profile update failed', err);
      toast.error('Failed to commit profile updates.');
    }
  };

  const toggleDay = (day) => {
    if (availabilityDays.includes(day)) {
      setAvailabilityDays(availabilityDays.filter(d => d !== day));
    } else {
      setAvailabilityDays([...availabilityDays, day]);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="space-y-10 p-2 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-96" />
          <Skeleton className="lg:col-span-4 h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="p-4 bg-red-500/10 text-red-400 rounded-full mb-6 animate-bounce">
          <HeartPulse className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Clinical Link Failure</h2>
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">{error}</p>
        <Button onClick={fetchDashboard}>Retry Handshake</Button>
      </div>
    );
  }

  const { stats, recentActivity, profile } = data;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
            <Stethoscope className="w-4 h-4 text-aayu-emerald" />
            Doctor Workflow Operating Portal
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Welcome, <span className="text-aayu-emerald">Dr. {profile?.name}</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            {profile?.specialization || 'General Practitioner'} • Clinic is active and synchronized.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/patients')}
            className="px-5 py-3.5 font-bold uppercase tracking-wider text-xs"
          >
            Find Patients
          </Button>
          <Button 
            onClick={() => navigate('/doctor/prescriptions')}
            className="px-6 py-3.5 shadow-lg shadow-aayu-emerald/20 font-bold uppercase tracking-wider text-xs"
          >
            <Plus className="w-4 h-4" /> Create Prescription
          </Button>
        </div>
      </div>

      {/* KPI stats section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Active Patients", value: stats.patientsHandled, icon: Users, color: "text-aayu-cyan", glow: "shadow-aayu-cyan/5" },
          { label: "Today appointments", value: stats.todayAppointments, icon: Calendar, color: "text-aayu-emerald", glow: "shadow-aayu-emerald/5" },
          { label: "Total Consultations", value: stats.consultationsCompleted, icon: Activity, color: "text-aayu-saffron", glow: "shadow-aayu-saffron/5" },
          { label: "Prescriptions Written", value: stats.prescriptionsCreated, icon: FileText, color: "text-purple-400", glow: "shadow-purple-500/5" },
          { label: "Daily Consulting Avg", value: stats.avgConsultationsPerDay, icon: TrendingUp, color: "text-pink-400", glow: "shadow-pink-500/5" }
        ].map((item, index) => (
          <Card 
            key={index}
            className={`p-6 border-white/5 hover:border-white/15 transition-all duration-300 ${item.glow}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                <h3 className="text-2xl font-black text-white tracking-tight">{item.value}</h3>
              </div>
              <div className={`p-2.5 bg-white/[0.02] rounded-xl ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Activity Timeline and Profile View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Activity Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-aayu-emerald" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Clinical Activity Feed</h2>
          </div>

          <Card className="p-6 border-white/5 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-l-2 border-aayu-emerald pl-2">Latest Visits & Consultations</h3>
              
              {recentActivity.latestConsultations?.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.latestConsultations.map((visit, idx) => (
                    <div 
                      key={visit._id}
                      onClick={() => navigate(`/patient/${visit.patientId?._id || visit.patientId}`)}
                      className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-aayu-emerald/30 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-aayu-emerald/10 text-aayu-emerald flex items-center justify-center font-bold text-xs uppercase group-hover:scale-105 transition-transform">
                          {visit.patientId?.fullName ? visit.patientId.fullName[0] : 'P'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-aayu-emerald transition-colors">
                            {visit.patientId?.fullName || 'Patient Record'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold">{visit.diagnosis || 'General Consultation'}</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">{new Date(visit.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">No recent consultations processed today.</p>
              )}
            </div>

            <hr className="border-white/5" />

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-l-2 border-aayu-cyan pl-2">Recent Prescriptions Created</h3>
              
              {recentActivity.latestPrescriptions?.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.latestPrescriptions.map((presc, idx) => (
                    <div 
                      key={presc._id}
                      onClick={() => navigate(`/patient/${presc.patientId?._id || presc.patientId}`)}
                      className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-aayu-cyan/30 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-aayu-cyan/10 text-aayu-cyan flex items-center justify-center font-bold text-xs">
                          Rx
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-aayu-cyan transition-colors">
                            {presc.patientId?.fullName || 'Patient'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            {presc.medicines?.length} medicines prescribed • {presc.diagnosis || 'Consultation'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">{new Date(presc.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">No recent prescriptions cataloged.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Profile & Availability Config */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider text-sm">
              <User className="w-5 h-5 text-aayu-cyan" />
              Doctor Profile
            </h2>
            
            {!editingProfile ? (
              <Button 
                variant="ghost" 
                onClick={() => setEditingProfile(true)}
                className="text-xs font-bold p-1 bg-transparent hover:bg-transparent text-aayu-cyan hover:text-white"
              >
                <Edit3 className="w-4.5 h-4.5 mr-1" /> Edit
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => setEditingProfile(false)}
                className="text-xs font-bold p-1 bg-transparent hover:bg-transparent text-red-400 hover:text-white"
              >
                <X className="w-4.5 h-4.5 mr-1" /> Cancel
              </Button>
            )}
          </div>

          <Card className="p-6 border-white/5 space-y-6 relative overflow-hidden bg-gradient-to-b from-aayu-cyan/[0.02] to-transparent">
            {/* Glowing side highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-cyan/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-aayu-emerald to-aayu-cyan p-0.5 shadow-xl shadow-aayu-cyan/10">
                <div className="w-full h-full rounded-[22px] bg-aayu-navy-deep flex items-center justify-center text-3xl font-black text-white">
                  {profile?.name ? profile.name[0] : 'Dr'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Dr. {profile?.name}</h3>
                <Badge variant="ai" className="mt-1.5">{profile?.role || 'doctor'}</Badge>
              </div>
            </div>

            <hr className="border-white/5" />

            {!editingProfile ? (
              // Display state
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Specialization</p>
                  <p className="text-sm font-semibold text-slate-300">{profile?.specialization || 'Not Specified'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Availability Hours</p>
                  <p className="text-sm font-semibold text-slate-300">{profile?.availability?.hours || 'Not Configured'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Days</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile?.availability?.days?.length > 0 ? (
                      profile.availability.days.map((day, i) => (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 bg-white/5 border border-white/5 text-slate-300 rounded-lg">
                          {day.slice(0, 3)}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No available days listed.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure Contact</p>
                  <p className="text-xs font-semibold text-slate-400">{profile?.email}</p>
                </div>
              </div>
            ) : (
              // Editable state
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Specialization</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cardiologist, General Physician"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Availability Hours</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50"
                    value={availabilityHours}
                    onChange={(e) => setAvailabilityHours(e.target.value)}
                    placeholder="e.g. 09:00 AM - 05:00 PM"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Availability Days</label>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`text-[9px] font-black uppercase px-2 py-1.5 rounded-lg border text-center transition-all ${
                          availabilityDays.includes(day)
                            ? 'bg-aayu-cyan/15 border-aayu-cyan/40 text-aayu-cyan'
                            : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  className="w-full py-3 mt-4 bg-aayu-cyan hover:bg-aayu-cyan/80 text-white font-bold uppercase tracking-wider text-xs"
                >
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorDashboardPage;
