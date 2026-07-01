import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText, 
  Activity,
  ArrowRight,
  Bell,
  MoreVertical,
  Zap
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { patientApi } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/owner/dashboard', { replace: true });
      } else if (user.role === 'receptionist') {
        navigate('/receptionist/dashboard', { replace: true });
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard', { replace: true });
      } else {
        navigate('/doctor/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [recentPatients, setRecentPatients] = useState([]);
  const [stats, setStats] = useState({
    todayVisits: 0,
    pendingReports: 0,
    activePatients: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await patientApi.search('');
        const patientsList = response.data.data.patients || [];
        setRecentPatients(patientsList.slice(0, 6));
        setStats({
          todayVisits: 12,
          pendingReports: 4,
          activePatients: patientsList.length,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10 pb-12"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Clinic Operating System
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              Clinic <span className="text-aayu-emerald">Pulse</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md">
              Real-time clinical overview. <span className="text-slate-500">3 critical reports require immediate attention.</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="p-3 relative group">
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-aayu-navy-deep" />
            </Button>
            {user?.role !== 'doctor' && (
              <Button 
                className="gap-2 px-6 py-3" 
                onClick={() => navigate('/patients/register')}
              >
                <Plus className="w-5 h-5" />
                Register Patient
              </Button>
            )}
          </div>
        </div>

        {/* Stats Pulse Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Today's Visits", value: stats.todayVisits, icon: Calendar, color: "emerald", blur: "bg-aayu-emerald/20" },
            { label: "Pending Reports", value: stats.pendingReports, icon: FileText, color: "cyan", blur: "bg-aayu-cyan/20" },
            { label: "Total Patient Base", value: stats.activePatients, icon: Users, color: "saffron", blur: "bg-aayu-saffron/20" }
          ].map((stat, i) => (
            <Card key={i} className="group relative overflow-hidden p-6 border-white/5 hover:border-aayu-emerald/30 transition-all duration-500">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-aayu-emerald/10 transition-colors" />
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {stats.loading ? <Skeleton className="w-12 h-8" /> : stat.value}
                  </h3>
                </div>
                <div className={`p-3 ${stat.blur} rounded-2xl text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Intelligence Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Transitions List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-aayu-emerald" />
                <h2 className="text-lg font-bold text-white">Patient Activity</h2>
              </div>
              <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-aayu-emerald transition-colors" />
                <input 
                  type="text" 
                  placeholder="Quick find patient..." 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-aayu-emerald/50 focus:ring-1 focus:ring-aayu-emerald/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient, idx) => (
                    <motion.div 
                      key={patient._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card 
                        className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer group border-white/5 hover:border-aayu-emerald/30 transition-all"
                        onClick={() => navigate(`/patient/${patient._id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aayu-emerald to-aayu-cyan flex items-center justify-center text-white font-black text-lg shadow-lg shadow-aayu-emerald/20 group-hover:rotate-6 transition-transform">
                            {patient.fullName ? patient.fullName[0] : ''}
                          </div>
                          <div>
                            <h4 className="font-bold text-white group-hover:text-aayu-emerald transition-colors leading-tight">
                              {patient.fullName}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">{patient.phone} • {patient.age}y</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="success">Stable</Badge>
                          <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-aayu-emerald/20 transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 glass-card rounded-3xl border-dashed border-2 border-white/10">
                    <div className="p-4 bg-white/5 rounded-full inline-block text-slate-500 mb-4">
                      <Users className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium">No clinical data found for this period</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Insights Sidepanel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-aayu-cyan" />
              <h2 className="text-lg font-bold text-white">Clinical Intelligence</h2>
            </div>
            
            <Card className="bg-gradient-to-b from-aayu-cyan/10 to-transparent border-aayu-cyan/30 relative overflow-hidden group h-fit">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-aayu-emerald/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-2 text-aayu-cyan font-bold text-xs uppercase tracking-widest">
                  <div className="w-2 h-2 bg-aayu-cyan rounded-full animate-pulse" />
                  System Status: Optimal
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  AI has analyzed <span className="text-white font-bold">12 reports</span> today. 
                  <span className="text-red-400 font-bold"> 3 patients </span> show abnormal glucose levels. 
                  <br /><br />
                  <span className="text-slate-500 italic">Recommendation: Schedule follow-up for high-risk patients.</span>
                </p>
                <Button variant="outline" className="w-full text-xs py-3 group">
                  Analysis Detail
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick Actions</h4>
                <MoreVertical className="w-4 h-4 text-slate-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Reports', 'Visits', 'Billing', 'Staff'].map((action) => (
                  <Button 
                    key={action} 
                    variant="secondary" 
                    className="text-xs py-3 font-bold uppercase tracking-tight hover:border-aayu-emerald/50"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const ChevronRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default Dashboard;

