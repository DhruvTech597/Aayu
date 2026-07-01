import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Activity, 
  FileText, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  Calendar, 
  Search, 
  Clock, 
  Plus, 
  Briefcase, 
  Target, 
  Sparkles, 
  X,
  ChevronDown
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

const OwnerDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [range, setRange] = useState('30d');
  const [groupBy, setGroupBy] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Table search & sort states
  const [docSearch, setDocSearch] = useState('');
  const [sortField, setSortField] = useState('totalConsultations');
  const [sortAsc, setSortAsc] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [followUpFilter, setFollowUpFilter] = useState('scheduled');
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  const fetchFollowUps = async () => {
    setFollowUpsLoading(true);
    try {
      const res = await ownerApi.getFollowUps({ status: followUpFilter });
      setFollowUps(res.data.data.followUps || []);
    } catch (err) {
      console.error("Failed to load owner follow-ups", err);
    } finally {
      setFollowUpsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [followUpFilter]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = {
        range,
        groupBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      const res = await ownerApi.getDashboard(params);
      setData(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load owner dashboard', err);
      setError('Could not connect to clinic financial & aggregate analytics terminal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range, groupBy, startDate, endDate]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    setShowDatePicker(false);
    fetchDashboard();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#a855f7'];

  if (loading) {
    return (
      <div className="space-y-10 p-2 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
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
        <div className="p-4 bg-red-500/10 text-red-400 rounded-full mb-6">
          <Briefcase className="w-12 h-12 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Clinic Operations Block</h2>
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">{error}</p>
        <Button onClick={fetchDashboard}>Retry Synchronize</Button>
      </div>
    );
  }

  const { kpis, charts, recentActivity } = data;

  // Filter & sort doctor performance table
  const sortedDoctors = [...(charts.doctorPerformance || [])]
    .filter(doc => doc.name.toLowerCase().includes(docSearch.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-16"
    >
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-aayu-emerald" />
            Executive Enterprise Operations Panel
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Clinic <span className="text-aayu-emerald">Analytics</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Clinic-wide KPIs, financial parameters, doctor performance index, and growth metrics.
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
                    ? 'bg-aayu-emerald text-white shadow-md'
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
            <option value="daily" className="bg-slate-900 text-white">Daily aggregate</option>
            <option value="weekly" className="bg-slate-900 text-white">Weekly aggregate</option>
            <option value="monthly" className="bg-slate-900 text-white">Monthly aggregate</option>
          </select>

          <Button 
            variant="secondary"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-xs py-2.5 gap-1.5"
          >
            <Calendar className="w-4 h-4 text-aayu-emerald" />
            {startDate && endDate ? `${startDate} to ${endDate}` : 'Custom Date'}
          </Button>

          <a 
            href={ownerApi.getCSVExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-aayu-emerald hover:bg-aayu-emerald-light text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            Export CSV
          </a>
          <a 
            href={ownerApi.getPDFExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-aayu-cyan hover:bg-aayu-cyan/85 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            Export PDF
          </a>
        </div>
      </div>

      {/* Date Picker Dropdown Overlay */}
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
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-emerald/50"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-aayu-emerald/50"
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

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Clinic Patient Base", value: kpis.totalPatients, icon: Users, sub: "Registered clients", color: "text-aayu-cyan" },
          { label: "Estimated Revenue", value: `₹${kpis.estimatedRevenue.toLocaleString()}`, icon: DollarSign, sub: `Based on ₹${kpis.averageConsultationFee}/consult`, color: "text-aayu-emerald" },
          { label: "Total consultations", value: kpis.totalConsultations, icon: Activity, sub: "Completed visits", color: "text-aayu-saffron" },
          { label: "Prescriptions Written", value: kpis.totalPrescriptions, icon: FileText, sub: "Digital issued", color: "text-purple-400" },
          { label: "Patient Retention", value: `${kpis.patientRetentionRate}%`, icon: Percent, sub: "Patients with >= 2 visits", color: "text-pink-400" },
          { label: "Follow-Up Success Rate", value: `${kpis.followUpCompletionRate}%`, icon: Target, sub: "Completed follow-ups", color: "text-indigo-400" }
        ].map((item, index) => (
          <Card key={index} className="p-6 border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                <h3 className="text-3xl font-black text-white tracking-tight">{item.value}</h3>
                <p className="text-[9px] text-slate-500 font-semibold">{item.sub}</p>
              </div>
              <div className={`p-3 bg-white/[0.02] rounded-2xl ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Analytics Graph Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Patient Growth Area Chart */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-emerald pl-2">Patient Growth & Registration Trend</h2>
          <Card className="p-6 border-white/5 h-[350px]">
            {charts.patientGrowth?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.patientGrowth}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#growthGrad)" strokeWidth={2} name="New Patients" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">No timeline registrations recorded.</div>
            )}
          </Card>
        </div>

        {/* Follow-up Completion Status Pie Chart */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-cyan pl-2">Follow-Up Completion Status</h2>
          <Card className="p-6 border-white/5 h-[350px] flex flex-col justify-between">
            <div className="flex-1 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Scheduled', value: kpis.followUps.scheduled },
                      { name: 'Completed', value: kpis.followUps.completed },
                      { name: 'Missed', value: kpis.followUps.missed }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div>
                <p className="text-aayu-saffron">Scheduled</p>
                <h4 className="text-white text-base font-black mt-0.5">{kpis.followUps.scheduled}</h4>
              </div>
              <div>
                <p className="text-aayu-emerald">Completed</p>
                <h4 className="text-white text-base font-black mt-0.5">{kpis.followUps.completed}</h4>
              </div>
              <div>
                <p className="text-red-400">Missed</p>
                <h4 className="text-white text-base font-black mt-0.5">{kpis.followUps.missed}</h4>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Second Graph Panel: Consultation & Prescription Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Daily Consultations and Prescriptions */}
        <div className="lg:col-span-12 space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-saffron pl-2">Consultation Volume & Prescription Issuance Trends</h2>
          <Card className="p-6 border-white/5 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.consultationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Doctor Performance Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-indigo-400 pl-2">Clinical Staff & Doctor Performance Index</h2>
          
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
            <input 
              type="text" 
              placeholder="Search clinician..." 
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-400/50"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-5">Doctor Name</th>
                <th className="p-5 cursor-pointer hover:text-white" onClick={() => handleSort('uniquePatients')}>
                  Patients Handled {sortField === 'uniquePatients' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-5 cursor-pointer hover:text-white" onClick={() => handleSort('totalConsultations')}>
                  Consultations completed {sortField === 'totalConsultations' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-5">Estimated Billing contribution</th>
                <th className="p-5 text-right">Clinician Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {sortedDoctors.length > 0 ? (
                sortedDoctors.map((doc, idx) => {
                  const billVal = doc.totalConsultations * AVERAGE_CONSULTATION_FEE;
                  const score = Math.min(100, Math.round((doc.totalConsultations * 10) + (doc.uniquePatients * 5)));
                  
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7.5 h-7.5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                          {doc.name[0]}
                        </div>
                        Dr. {doc.name}
                      </td>
                      <td className="p-5 text-slate-400 font-bold">{doc.uniquePatients} patients</td>
                      <td className="p-5 text-slate-400 font-bold">{doc.totalConsultations} visits</td>
                      <td className="p-5 text-aayu-emerald font-black">₹{billVal.toLocaleString()}</td>
                      <td className="p-5 text-right">
                        <Badge variant={score > 80 ? 'success' : score > 50 ? 'ai' : 'warning'}>
                          {score}% Optimal
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500">No medical doctors indexed in analytics timeline.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-Up Management Registry */}
      <div className="space-y-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-aayu-cyan pl-2">
              Advanced Follow-Up Registry
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold ml-2.5">
              Supervise and transition future clinical bookings.
            </p>
          </div>

          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {[
              { label: 'Scheduled', value: 'scheduled' },
              { label: 'Completed', value: 'completed' },
              { label: 'Missed', value: 'missed' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFollowUpFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  followUpFilter === tab.value
                    ? 'bg-aayu-cyan text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-5">Patient Name</th>
                <th className="p-5">Doctor Ref</th>
                <th className="p-5">Follow-Up Date</th>
                <th className="p-5">Reason / Diagnosis</th>
                <th className="p-5 text-right">Lobby controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {followUpsLoading ? (
                Array(2).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-5"><Skeleton className="h-10 w-24" /></td>
                    <td className="p-5"><Skeleton className="h-10 w-20" /></td>
                    <td className="p-5"><Skeleton className="h-10 w-16" /></td>
                    <td className="p-5"><Skeleton className="h-10 w-24" /></td>
                    <td className="p-5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : followUps.length > 0 ? (
                followUps.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-5 font-bold text-white flex items-center gap-2.5">
                      <div className="w-7.5 h-7.5 rounded-lg bg-aayu-cyan/10 text-aayu-cyan flex items-center justify-center font-bold">
                        {item.patientId?.fullName ? item.patientId.fullName[0] : 'P'}
                      </div>
                      <div>
                        {item.patientId?.fullName || 'Jane Doe'}
                        <p className="text-[9px] text-slate-500 font-semibold">{item.patientId?.phone}</p>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-white">
                      Dr. {item.doctorId?.name}
                      <p className="text-[9px] text-slate-500 font-medium">{item.doctorId?.specialization}</p>
                    </td>
                    <td className="p-5 text-slate-400 font-bold">
                      {item.followUpDate ? new Date(item.followUpDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-5 text-xs text-slate-400 max-w-xs truncate">
                      {item.diagnosis || 'Cardiology Synopsis'}
                    </td>
                    <td className="p-5 text-right space-x-2">
                      {item.followUpStatus === 'scheduled' && (
                        <>
                          <Button
                            onClick={async () => {
                              try {
                                await ownerApi.updateFollowUpStatus(item._id, 'completed');
                                toast.success("Follow-up completed!");
                                fetchFollowUps();
                              } catch (err) {
                                toast.error("Update failed.");
                              }
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-aayu-emerald hover:bg-aayu-emerald/85 text-white"
                          >
                            Mark Completed
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              try {
                                await ownerApi.updateFollowUpStatus(item._id, 'missed');
                                toast.success("Follow-up marked as Missed.");
                                fetchFollowUps();
                              } catch (err) {
                                toast.error("Update failed.");
                              }
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider py-1.5 px-2.5"
                          >
                            Missed
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500">No scheduled follow-up bookings matching this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default OwnerDashboardPage;
