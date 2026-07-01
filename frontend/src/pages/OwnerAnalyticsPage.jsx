import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  FileText, 
  Percent, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Cpu
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { ownerApi } from '../services/apiService';
import { toast } from 'react-hot-toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const OwnerAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [range, setRange] = useState('30d');
  const [groupBy, setGroupBy] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Tab controls
  const [activeTab, setActiveTab] = useState('patients');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        range,
        groupBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      // Fetch clinic-wide detailed analytics charts and KPIs
      const res = await ownerApi.getDashboard(params);
      setData(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load owner analytics data', err);
      setError('Could not establish connection to the analytics server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, groupBy, startDate, endDate]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    setShowDatePicker(false);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="space-y-10 p-2 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center">
        <Cpu className="w-12 h-12 text-red-400 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">Analytics Engine Offline</h2>
        <p className="text-slate-500 mb-8">{error}</p>
        <Button onClick={fetchAnalytics}>Reconnect</Button>
      </div>
    );
  }

  const { kpis, charts, recentActivity } = data;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-cyan font-bold text-xs uppercase tracking-widest">
            <Cpu className="w-4 h-4 text-aayu-cyan" />
            Clinic Intelligence Terminal
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Clinic <span className="text-aayu-cyan">Intelligence</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Deep dive clinic analytics, patient demographics, prescription metrics, and performance charts.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {[
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' },
              { label: '90D', value: '90d' },
              { label: '1Y', value: '1y' }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => {
                  setRange(btn.value);
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  range === btn.value && !startDate
                    ? 'bg-aayu-cyan text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <select
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 outline-none cursor-pointer"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="daily">Daily grouping</option>
            <option value="weekly">Weekly grouping</option>
            <option value="monthly">Monthly grouping</option>
          </select>

          <Button 
            variant="secondary"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-xs py-2.5 gap-1.5"
          >
            <Calendar className="w-4 h-4 text-aayu-cyan" />
            {startDate && endDate ? `${startDate} to ${endDate}` : 'Custom Date'}
          </Button>
        </div>
      </div>

      {/* Date picker drop overlay */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 border border-white/10 rounded-2xl w-full max-w-md ml-auto"
          >
            <form onSubmit={handleApplyCustomDates} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-cyan/50"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-cyan/50"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setShowDatePicker(false);
                  }}
                  className="text-xs"
                >
                  Clear
                </Button>
                <Button type="submit" className="text-xs">
                  Apply Filter
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab controls */}
      <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 w-full max-w-lg">
        {[
          { id: 'patients', label: 'Patient Analytics', icon: Users },
          { id: 'consultations', label: 'Consultations', icon: Activity },
          { id: 'prescriptions', label: 'Prescriptions & Rx', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id
                ? 'bg-aayu-cyan text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4.5 h-4.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Contents */}
      <div className="space-y-8">
        {activeTab === 'patients' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Registered Patients</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.totalPatients}</h3>
                <span className="text-[10px] text-aayu-cyan font-bold">In selected date filter</span>
              </Card>
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Retention Rate</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.patientRetentionRate}%</h3>
                <span className="text-[10px] text-slate-500 font-bold">Stable patient ratios</span>
              </Card>
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Visits per patient</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.averageVisitsPerPatient}</h3>
                <span className="text-[10px] text-slate-500 font-bold">Consultation density</span>
              </Card>
            </div>

            <Card className="p-6 border-white/5 h-[400px]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Patient Growth Over Time</h3>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={charts.patientGrowth}>
                  <defs>
                    <linearGradient id="cyanGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#cyanGrowth)" strokeWidth={2} name="Patients" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {activeTab === 'consultations' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Consultations</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.totalConsultations}</h3>
                <span className="text-[10px] text-aayu-saffron font-bold">Physician engagements</span>
              </Card>
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue estimation</p>
                <h3 className="text-3xl font-black text-aayu-emerald tracking-tight mt-1">₹{kpis.estimatedRevenue.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-500 font-bold">Standard consultation rates</span>
              </Card>
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Doctors Assigned</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.totalDoctors}</h3>
                <span className="text-[10px] text-slate-500 font-bold">Clinical staff density</span>
              </Card>
            </div>

            <Card className="p-6 border-white/5 h-[400px]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Consultation Trends</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={charts.consultationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} name="Consultations" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {activeTab === 'prescriptions' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Issued Rx</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.totalPrescriptions}</h3>
                <span className="text-[10px] text-purple-400 font-bold">Clinical prescriptions</span>
              </Card>
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Follow-Up Success Rate</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.followUpCompletionRate}%</h3>
                <span className="text-[10px] text-slate-500 font-bold">Target conversion ratios</span>
              </Card>
              <Card className="p-6 border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scheduled Follow-Ups</p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1">{kpis.followUps.scheduled}</h3>
                <span className="text-[10px] text-slate-500 font-bold">Active clinic pipelines</span>
              </Card>
            </div>

            <Card className="p-6 border-white/5 h-[400px]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Prescription Issuance Over Time</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={charts.prescriptionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="Rx Prescriptions" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default OwnerAnalyticsPage;
