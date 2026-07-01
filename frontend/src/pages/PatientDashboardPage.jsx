import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Calendar, 
  FileText, 
  Pill, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Heart,
  User,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { patientApi } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await patientApi.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to sync patient dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <div className="h-10 w-1/3 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="p-4 bg-red-500/10 rounded-full text-red-400 mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sync Connection Error</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md">{error}</p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    );
  }

  const { patient, metrics, upcomingAppointment } = data || {};
  const scoreColor = metrics?.healthScore >= 90 
    ? 'text-aayu-emerald' 
    : metrics?.healthScore >= 75 
      ? 'text-aayu-cyan' 
      : 'text-aayu-saffron';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-saffron font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Patient Health Gateway
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Welcome, <span className="text-aayu-emerald">{patient?.fullName}</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Manage your personal healthcare records, clinical schedules, and diagnostic reports.
          </p>
        </div>
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-aayu-emerald rounded-full animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Synchronized</span>
        </div>
      </div>

      {/* Health Snapshot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Index Card */}
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-aayu-emerald/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Health Score</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black ${scoreColor} tracking-tight`}>{metrics?.healthScore}%</span>
            <span className="text-xs text-slate-500 font-bold">Optimal</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-aayu-emerald h-full rounded-full" style={{ width: `${metrics?.healthScore}%` }} />
          </div>
        </Card>

        {/* Blood Pressure Card */}
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-aayu-cyan/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Blood Pressure</p>
          <span className="text-xl font-bold text-white leading-tight block">{metrics?.bpStatus.split(" ")[0]}</span>
          <span className="text-xs text-slate-400 font-medium mt-2 block">{metrics?.bpStatus.replace(/^[\d\/]+ mmHg /, '')}</span>
        </Card>

        {/* Sugar Status Card */}
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-aayu-saffron/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sugar Status</p>
          <span className="text-xl font-bold text-white leading-tight block">{metrics?.sugarStatus.split(" ")[0]}</span>
          <span className="text-xs text-slate-400 font-medium mt-2 block">{metrics?.sugarStatus.replace(/^[\d]+ mg\/dL /, '')}</span>
        </Card>

        {/* BMI Card */}
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">BMI Index</p>
          <span className="text-xl font-bold text-white leading-tight block">{metrics?.bmiStatus.split(" ")[0]}</span>
          <span className="text-xs text-slate-400 font-medium mt-2 block">{metrics?.bmiStatus.replace(/^[\d\.]+ /, '')}</span>
        </Card>
      </div>

      {/* Main Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Upcoming Appointments & AI Insight */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upcoming Appointment Card */}
          <Card className="p-8 border-white/10 relative overflow-hidden bg-gradient-to-r from-aayu-navy to-slate-900 shadow-xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-aayu-cyan/5 blur-3xl rounded-full" />
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5">
              <Calendar className="text-aayu-cyan w-5.5 h-5.5" />
              Nearest Appointment
            </h3>

            {upcomingAppointment ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-aayu-cyan to-aayu-emerald rounded-2xl flex items-center justify-center text-white font-extrabold text-xl">
                    {upcomingAppointment.doctorId?.name ? upcomingAppointment.doctorId.name[0] : 'D'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-lg">Dr. {upcomingAppointment.doctorId?.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{upcomingAppointment.doctorId?.specialization || 'General Physician'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-8">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-bold text-white">{new Date(upcomingAppointment.appointmentDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Time</p>
                    <p className="text-sm font-bold text-white">
                      {new Date(upcomingAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                    <Badge variant={upcomingAppointment.status === 'pending' ? 'warning' : 'success'} className="capitalize">{upcomingAppointment.status}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-slate-400 text-sm font-medium">No upcoming appointments scheduled</p>
                <p className="text-xs text-slate-600 mt-1">Book a new consult to meet your clinical team.</p>
              </div>
            )}
          </Card>

          {/* AI Clinical Insights */}
          <Card className="p-8 border-aayu-cyan/20 bg-gradient-to-br from-aayu-cyan/[0.04] to-transparent relative overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Heart className="text-aayu-cyan w-4 h-4" />
              Clinical AI Status
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
              "{metrics?.aiStatus}"
            </p>
          </Card>
        </div>

        {/* Right Column - Quick Actions Panel */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">Quick Patient Actions</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Book Appointment', desc: 'Schedule a doctor consultation', icon: Calendar, path: '/patient/appointments', color: 'text-aayu-cyan bg-aayu-cyan/10' },
              { label: 'View Reports', desc: 'Read your diagnostic reports', icon: FileText, path: '/patient/reports', color: 'text-red-400 bg-red-400/10' },
              { label: 'Download Health Card', desc: 'Print or export digital card', icon: User, path: '/patient/card', color: 'text-aayu-emerald bg-aayu-emerald/10' },
              { label: 'View Prescriptions', desc: 'Active dosage scheduling details', icon: Pill, path: '/patient/prescriptions', color: 'text-aayu-saffron bg-aayu-saffron/10' },
              { label: 'Medical Timeline', desc: 'Aggregated health logs history', icon: Clock, path: '/patient/timeline', color: 'text-purple-400 bg-purple-400/10' },
            ].map((action, i) => (
              <Card 
                key={i} 
                className="p-5 flex items-center justify-between hover:bg-white/5 cursor-pointer border-white/5 hover:border-white/10 transition-all group"
                onClick={() => navigate(action.path)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${action.color} shrink-0`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white group-hover:text-aayu-emerald transition-colors leading-tight">{action.label}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">{action.desc}</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            ))}
          </div>

          <div className="p-4 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-center gap-2 text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-6">
            <ShieldCheck className="w-3.5 h-3.5 text-aayu-emerald" />
            End-to-End HIPAA Protected File
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default PatientDashboardPage;
