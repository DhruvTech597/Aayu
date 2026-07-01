import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Flame,
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Send,
  Trash2,
  FileText,
  ShieldAlert,
  Search,
  MessageSquare,
  Gauge,
  Heart,
  Pill,
  UserCheck
} from 'lucide-react';
import { Card, Button, Badge, Skeleton, Input } from '../components/ui/CommonUI';
import { aiApi, reportApi } from '../services/apiService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PatientAiPage = () => {
  const { user } = useAuth();
  const chatEndRef = useRef(null);

  // Core navigation tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Loading states
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingSymptom, setLoadingSymptom] = useState(false);
  const [loadingMed, setLoadingMed] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Domain states
  const [coachData, setCoachData] = useState(null);
  const [summaryData, setSummaryData] = useState('');
  const [summaryLang, setSummaryLang] = useState('English');

  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [reportExplanation, setReportExplanation] = useState('');

  const [symptomInput, setSymptomInput] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('');
  const [symptomResult, setSymptomResult] = useState('');

  const [medQuestion, setMedQuestion] = useState('');
  const [medAnswer, setMedAnswer] = useState('');

  const [riskData, setRiskData] = useState('');

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLang, setChatLang] = useState('English');

  // Fetch AI Health Coach & Checklist
  const fetchCoachStatus = async (silent = false) => {
    try {
      if (!silent) setLoadingCoach(true);
      const res = await aiApi.getCoachStatus();
      setCoachData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync Health Coach stats');
    } finally {
      if (!silent) setLoadingCoach(false);
    }
  };

  // Fetch Patient Reports for Explainer dropdown
  const fetchReports = async () => {
    try {
      const res = await reportApi.getAll();
      const data = res.data.data || [];
      setReports(data);
      if (data.length > 0) {
        setSelectedReportId(data[0]._id);
        if (data[0].aiExplanation) {
          setReportExplanation(data[0].aiExplanation);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoachStatus();
    fetchReports();
  }, []);

  // Fetch Chat History when tab switches to chatbot
  useEffect(() => {
    if (activeTab === 'chatbot') {
      const loadChat = async () => {
        try {
          setLoadingChat(true);
          const res = await aiApi.getChatHistory();
          setChatMessages(res.data.data.messages || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingChat(false);
        }
      };
      loadChat();
    }
  }, [activeTab]);

  // Scroll Chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle Checklist Task Toggle
  const handleToggleTask = async (taskId, currentCompleted) => {
    try {
      // Optimistic Update
      const updatedTasks = coachData.dailyTasks.map(t => 
        t._id === taskId ? { ...t, completed: !currentCompleted } : t
      );
      setCoachData(prev => ({ ...prev, dailyTasks: updatedTasks }));

      const res = await aiApi.toggleCoachTask(taskId, !currentCompleted);
      setCoachData(res.data.data);
      
      const newlyCompleted = !currentCompleted;
      if (newlyCompleted) {
        toast.success('Task marked complete! Keep it up!');
      } else {
        toast.success('Task unchecked.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task state');
      // Revert state
      fetchCoachStatus(true);
    }
  };

  // Generate Explain My Health
  const handleGenerateSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await aiApi.explainHealth(summaryLang);
      setSummaryData(res.data.data.summary);
      toast.success('AI Health Summary generated!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Could not explain health records');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Generate Report Explanation
  const handleExplainReport = async (regenerate = false) => {
    if (!selectedReportId) return;
    try {
      setLoadingReport(true);
      const res = await aiApi.explainReport(selectedReportId, regenerate);
      setReportExplanation(res.data.data.explanation);
      toast.success(regenerate ? 'Explanation regenerated!' : 'Report explanation synced!');
      
      // Update report list local copy
      setReports(prev => prev.map(r => 
        r._id === selectedReportId ? { ...r, aiExplanation: res.data.data.explanation } : r
      ));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to explain report');
    } finally {
      setLoadingReport(false);
    }
  };

  // Handle Report selection change
  const handleReportChange = (e) => {
    const id = e.target.value;
    setSelectedReportId(id);
    const selected = reports.find(r => r._id === id);
    setReportExplanation(selected?.aiExplanation || '');
  };

  // Run Symptom Check
  const handleSymptomCheck = async (e) => {
    e.preventDefault();
    if (!symptomInput || !symptomDuration) {
      toast.error('Please fill in both symptoms and duration');
      return;
    }
    try {
      setLoadingSymptom(true);
      const res = await aiApi.checkSymptoms(symptomInput, symptomDuration);
      setSymptomResult(res.data.data.analysis);
      toast.success('Symptom assessment complete!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Could not analyze symptoms');
    } finally {
      setLoadingSymptom(false);
    }
  };

  // Ask Medication Question
  const handleMedQuery = async (e) => {
    e.preventDefault();
    if (!medQuestion) return;
    try {
      setLoadingMed(true);
      const res = await aiApi.answerMedicationQuery(medQuestion);
      setMedAnswer(res.data.data.answer);
      toast.success('AI response ready');
    } catch (err) {
      console.error(err);
      toast.error('Could not answer medication query');
    } finally {
      setLoadingMed(false);
    }
  };

  // Predict Health Risks
  const handlePredictRisks = async () => {
    try {
      setLoadingRisk(true);
      const res = await aiApi.predictRisks();
      setRiskData(res.data.data.predictions);
      toast.success('Health risk scan completed!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to run health risk predictor');
    } finally {
      setLoadingRisk(false);
    }
  };

  // Send Message to Aayu Chatbot
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const originalInput = chatInput;
    setChatInput('');

    try {
      setLoadingChat(true);
      const res = await aiApi.converseChatbot(originalInput, chatLang);
      setChatMessages(res.data.data.messages || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send chatbot message');
    } finally {
      setLoadingChat(false);
    }
  };

  // Clear Chat history
  const handleClearChat = async () => {
    try {
      await aiApi.clearChatHistory();
      setChatMessages([]);
      toast.success('Chat history cleared');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear conversation history');
    }
  };

  // Formatter helper for structured markdown prompts
  const renderFormattedAiContent = (text) => {
    if (!text) return null;
    
    // Ensure medical disclaimer is styled differently
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.includes('AI-generated guidance only. Consult a qualified doctor')) {
        return (
          <div key={idx} className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <ShieldAlert className="text-red-400 w-5 h-5 shrink-0" />
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wide leading-relaxed">
              {line.replace(/\*/g, '')}
            </p>
          </div>
        );
      }
      
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-extrabold text-aayu-emerald mt-6 mb-2 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-aayu-cyan shrink-0" />
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg font-black text-white mt-8 mb-3 tracking-tight">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.trim().startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1 ml-4">
            <span className="w-1.5 h-1.5 bg-aayu-cyan rounded-full mt-2 shrink-0" />
            <span className="text-sm text-slate-300 font-medium leading-relaxed">
              {line.trim().replace(/^- /, '')}
            </span>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-300 font-medium leading-relaxed my-1">
          {line.replace(/\*/g, '')}
        </p>
      );
    });
  };

  // Trend line chart renderer
  const renderTrendChart = (history) => {
    if (!history || history.length < 2) {
      return (
        <div className="h-32 flex items-center justify-center text-slate-500 text-xs italic bg-white/[0.01] rounded-2xl border border-white/5">
          Not enough health score data points yet. Keep active!
        </div>
      );
    }

    const scores = history.map(h => h.score);
    const maxScore = 100;
    const minScore = 50;
    const range = maxScore - minScore;
    
    const width = 500;
    const height = 120;
    const padding = 20;
    
    const points = history.map((h, i) => {
      const x = padding + (i * (width - 2 * padding) / (history.length - 1));
      const y = height - padding - ((h.score - minScore) * (height - 2 * padding) / range);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-aayu-cyan" />
            Health Index History
          </span>
          <span className="text-[10px] font-bold text-aayu-cyan uppercase tracking-wider">Last {history.length} Scans</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
            {/* Grid lines */}
            <line x1="0" y1={padding} x2={width} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
            <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
            <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
            
            {/* Fill gradient area */}
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            <path
              d={`M ${padding},${height - padding} L ${points} L ${padding + (history.length - 1) * (width - 2 * padding) / (history.length - 1)},${height - padding} Z`}
              fill="url(#chart-grad)"
            />
            
            {/* Trend line */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              className="drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
            />
            
            {/* Data points */}
            {history.map((h, i) => {
              const x = padding + (i * (width - 2 * padding) / (history.length - 1));
              const y = height - padding - ((h.score - minScore) * (height - 2 * padding) / range);
              return (
                <g key={i} className="group/dot cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-slate-900 stroke-aayu-emerald stroke-[2.5] hover:r-6 hover:stroke-white transition-all duration-150"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20 max-w-7xl mx-auto"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-cyan font-bold text-xs uppercase tracking-widest">
            <Brain className="w-4 h-4 animate-pulse text-aayu-cyan" />
            Advanced Clinical AI Layer
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            AI Health <span className="text-aayu-cyan">Suite</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Explore personalized AI summaries, medical record explanations, symptom checkers, and health coach challenges.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="ai" className="px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider shadow-inner">
            Aayu AI Engine Active
          </Badge>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Tabs (Left) */}
        <div className="lg:col-span-3 space-y-2.5">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">AI Modules</h3>
          {[
            { id: 'overview', label: 'AI Suite Overview', icon: Activity },
            { id: 'coach', label: 'AI Health Coach', icon: Trophy, count: coachData?.dailyTasks?.filter(t => !t.completed).length },
            { id: 'summary', label: 'Explain My Health', icon: Brain },
            { id: 'reports', label: 'Report Explainer', icon: FileText },
            { id: 'symptoms', label: 'Symptom Checker', icon: HelpCircle },
            { id: 'medication', label: 'Medication Assistant', icon: Pill },
            { id: 'risk', label: 'Risk Predictor', icon: Gauge },
            { id: 'chatbot', label: 'Health Bot Chat', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold tracking-tight transition-all duration-300 group ${
                activeTab === tab.id
                  ? 'bg-aayu-cyan/10 border-aayu-cyan/30 text-aayu-cyan shadow-inner'
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={`w-4.5 h-4.5 transition-colors ${activeTab === tab.id ? 'text-aayu-cyan' : 'group-hover:text-white'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-aayu-cyan/20 text-aayu-cyan px-2 py-0.5 text-[9px] rounded-full font-black">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Workspace panel (Right) */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-aayu-cyan/5 blur-3xl rounded-full" />
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <Brain className="text-aayu-cyan w-6 h-6" />
                    Overview of AI Health Capabilities
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                    The MedAI connect intelligence layer parses your clinical history, laboratory biomarkers, and schedules. 
                    It is designed to translate dense medical notations into straightforward, supportive language.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-aayu-cyan/10 rounded-xl text-aayu-cyan">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Daily Streaks & Tasks</h4>
                        <p className="text-xs text-slate-400 leading-normal">
                          Engage in daily actionable tasks built by the health coach to manage active clinical conditions.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-aayu-emerald/10 rounded-xl text-aayu-emerald">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Explain My Health</h4>
                        <p className="text-xs text-slate-400 leading-normal">
                          Compile active diagnoses, prescriptions, and lab records into a warm health timeline.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-aayu-cyan/10 rounded-xl text-aayu-cyan">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Interactive Report Explainer</h4>
                        <p className="text-xs text-slate-400 leading-normal">
                          Inspect lab parameters. Identify High/Low ranges in clear, supportive sentences.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-4">
                      <div className="p-3 bg-aayu-saffron/10 rounded-xl text-aayu-saffron">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Clinical Conversational Bot</h4>
                        <p className="text-xs text-slate-400 leading-normal">
                          Converse with Aayu Chatbot. Clarify questions using active prescriptions as context.
                        </p>
                      </div>
                    </div>
                  </div>

                  {coachData && (
                    <div className="mt-8 border-t border-white/5 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Health Score</p>
                        <p className="text-2xl font-black text-aayu-emerald">{coachData?.healthScoreHistory?.slice(-1)[0]?.score || 95}%</p>
                      </div>
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Streak</p>
                        <p className="text-2xl font-black text-aayu-cyan flex items-center justify-center gap-1">
                          <Flame className="w-5 h-5 text-aayu-saffron fill-aayu-saffron animate-bounce" />
                          {coachData.streak} Days
                        </p>
                      </div>
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Badges Earned</p>
                        <p className="text-2xl font-black text-white">{coachData.badges?.length || 0}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Tab 2: Health Coach */}
            {activeTab === 'coach' && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {loadingCoach ? (
                  <Card className="p-8 space-y-6">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Checklist & Streaks (Left) */}
                    <div className="lg:col-span-8 space-y-6">
                      <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
                        <div className="flex justify-between items-center mb-6">
                          <div className="space-y-1">
                            <h3 className="text-lg font-black text-white">Daily Tasks</h3>
                            <p className="text-xs text-slate-400">Tick tasks to maintain and grow your active clinical streak.</p>
                          </div>
                          <Badge variant="success">Daily Challenge</Badge>
                        </div>

                        <div className="space-y-3">
                          {coachData?.dailyTasks && coachData.dailyTasks.length > 0 ? (
                            coachData.dailyTasks.map((t) => (
                              <div
                                key={t._id}
                                onClick={() => handleToggleTask(t._id, t.completed)}
                                className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all duration-300 ${
                                  t.completed 
                                    ? 'bg-aayu-emerald/5 border-aayu-emerald/30 text-slate-400' 
                                    : 'bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  t.completed ? 'bg-aayu-emerald border-aayu-emerald text-white' : 'border-white/20'
                                }`}>
                                  {t.completed && <CheckCircle2 className="w-4 h-4 text-slate-900 stroke-[3]" />}
                                </div>
                                <span className={`text-sm font-semibold leading-relaxed ${t.completed ? 'line-through opacity-60' : ''}`}>
                                  {t.task}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                              No daily tasks generated yet. Ask coach.
                            </div>
                          )}
                        </div>
                      </Card>

                      <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
                        <h3 className="text-lg font-black text-white mb-4">Weekly Goals</h3>
                        <div className="space-y-3">
                          {coachData?.weeklyGoals && coachData.weeklyGoals.length > 0 ? (
                            coachData.weeklyGoals.map((g, idx) => (
                              <div key={idx} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center gap-3">
                                <Activity className="text-aayu-cyan w-5 h-5 shrink-0" />
                                <span className="text-sm font-semibold text-slate-300">{g.goal}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                              No weekly goals loaded.
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    {/* Streak & Badges Panel (Right) */}
                    <div className="lg:col-span-4 space-y-6">
                      {/* Streak Card */}
                      <Card className="p-6 text-center border-white/5 bg-gradient-to-br from-aayu-cyan/[0.02] to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-aayu-cyan/5 rounded-full blur-2xl" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Streak Progress</p>
                        <div className="flex items-center justify-center gap-2 text-3xl font-black text-white tracking-tight">
                          <Flame className="w-8 h-8 text-aayu-saffron fill-aayu-saffron animate-bounce" />
                          {coachData?.streak || 0} Days
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Complete daily checklists to increase streaks.</p>
                      </Card>

                      {/* Health Score Sparkline */}
                      {coachData?.healthScoreHistory && (
                        <Card className="p-4 border-white/5">
                          {renderTrendChart(coachData.healthScoreHistory)}
                        </Card>
                      )}

                      {/* Badges card */}
                      <Card className="p-6 border-white/5">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-aayu-saffron" />
                          Earned Achievements
                        </h3>
                        <div className="space-y-3">
                          {coachData?.badges && coachData.badges.length > 0 ? (
                            coachData.badges.map((badge, idx) => (
                              <div key={idx} className="p-3 bg-gradient-to-r from-aayu-saffron/10 to-transparent border border-aayu-saffron/20 rounded-xl flex items-center gap-3">
                                <Trophy className="text-aayu-saffron w-5 h-5 shrink-0" />
                                <span className="text-xs font-bold text-white tracking-tight">{badge}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-600 text-xs italic">
                              No badges unlocked yet. Keep a 3-day streak to start!
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 3: Explain My Health */}
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white">Explain My Health Summary</h3>
                      <p className="text-xs text-slate-400">Compile visits, recipes, and biomarkers into simple words.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none"
                        value={summaryLang}
                        onChange={(e) => setSummaryLang(e.target.value)}
                      >
                        <option value="English" className="bg-slate-900 text-white">English</option>
                        <option value="Hindi" className="bg-slate-900 text-white">Hindi (हिन्दी)</option>
                        <option value="Gujarati" className="bg-slate-900 text-white">Gujarati (ગુજરાતી)</option>
                        <option value="Marathi" className="bg-slate-900 text-white">Marathi (मराठी)</option>
                      </select>
                      
                      <Button onClick={handleGenerateSummary} disabled={loadingSummary} size="sm">
                        {loadingSummary ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                        Generate Explain My Health
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 min-h-[30vh] space-y-4">
                    {summaryData ? (
                      <div>{renderFormattedAiContent(summaryData)}</div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-center">
                        <Brain className="w-10 h-10 text-slate-600 mb-2" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No Summary Generated Yet</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">Select your preferred translation language and click compile summary to begin.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Tab 4: Report Explainer */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white">Interactive Report Explainer</h3>
                      <p className="text-xs text-slate-400">Break down complex biomarker metrics into plain language.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {reports.length > 0 && (
                        <select
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none max-w-xs"
                          value={selectedReportId}
                          onChange={handleReportChange}
                        >
                          {reports.map((r) => (
                            <option key={r._id} value={r._id} className="bg-slate-900 text-white">
                              {r.reportType} ({new Date(r.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <Button 
                        onClick={() => handleExplainReport(false)} 
                        disabled={loadingReport || !selectedReportId} 
                        size="sm"
                      >
                        {loadingReport ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        Explain Report
                      </Button>
                      
                      {reportExplanation && (
                        <Button 
                          onClick={() => handleExplainReport(true)} 
                          disabled={loadingReport || !selectedReportId} 
                          variant="secondary" 
                          size="sm"
                        >
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 min-h-[30vh]">
                    {reportExplanation ? (
                      <div>{renderFormattedAiContent(reportExplanation)}</div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-center">
                        <FileText className="w-10 h-10 text-slate-600 mb-2" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No Report Selected / Explained</p>
                        <p className="text-xs text-slate-500 mt-1">Select a diagnostic report from the dropdown above and generate explaining insights.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Tab 5: Symptom Checker */}
            {activeTab === 'symptoms' && (
              <motion.div
                key="symptoms"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Form input */}
                  <div className="lg:col-span-5">
                    <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent">
                      <h3 className="text-lg font-black text-white mb-4">Symptom Checker</h3>
                      <form onSubmit={handleSymptomCheck} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Describe symptoms</label>
                          <textarea
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-medium min-h-[100px] resize-none"
                            placeholder="e.g. slight sore throat, nasal blockage, mild body aches"
                            value={symptomInput}
                            onChange={(e) => setSymptomInput(e.target.value)}
                          />
                        </div>

                        <Input
                          label="Duration / Since when"
                          placeholder="e.g. 2 days, since yesterday morning"
                          value={symptomDuration}
                          onChange={(e) => setSymptomDuration(e.target.value)}
                        />

                        <Button type="submit" disabled={loadingSymptom} className="w-full">
                          {loadingSymptom ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <HelpCircle className="w-4 h-4" />
                          )}
                          Analyze Symptoms
                        </Button>
                      </form>
                    </Card>
                  </div>

                  {/* Results Inspector */}
                  <div className="lg:col-span-7">
                    <Card className="p-6 border-white/5 min-h-[300px]">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Clinical Guidances</h4>
                      
                      {symptomResult ? (
                        <div>{renderFormattedAiContent(symptomResult)}</div>
                      ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-center">
                          <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Awaiting Symptom Checklist</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-xs">Fill in your symptoms and click Analyze to perform clinical pre-screening.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 6: Medication Assistant */}
            {activeTab === 'medication' && (
              <motion.div
                key="medication"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left input card */}
                  <div className="lg:col-span-5">
                    <Card className="p-6 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-4">
                      <h3 className="text-lg font-black text-white">Medication Q&A Assistant</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Aayu assistant extracts your active recipes to answer dosage timings, side effects, or drug interactions.
                      </p>

                      <form onSubmit={handleMedQuery} className="space-y-4">
                        <Input
                          label="Your Question"
                          placeholder="e.g. Can I take Metformin on an empty stomach?"
                          value={medQuestion}
                          onChange={(e) => setMedQuestion(e.target.value)}
                        />

                        <Button type="submit" disabled={loadingMed} className="w-full">
                          {loadingMed ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Pill className="w-4 h-4" />
                          )}
                          Ask Med Assistant
                        </Button>
                      </form>
                    </Card>
                  </div>

                  {/* Right Guidance Card */}
                  <div className="lg:col-span-7">
                    <Card className="p-6 border-white/5 min-h-[300px]">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Medication Instructions</h4>
                      {medAnswer ? (
                        <div>{renderFormattedAiContent(medAnswer)}</div>
                      ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-center">
                          <Pill className="w-10 h-10 text-slate-600 mb-2" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Awaiting Medication Question</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 7: Risk Predictor */}
            {activeTab === 'risk' && (
              <motion.div
                key="risk"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <Card className="p-8 border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white">Health Risk Predictor</h3>
                      <p className="text-xs text-slate-400">Scan biomarkers and details to forecast metabolic risk indices.</p>
                    </div>

                    <Button onClick={handlePredictRisks} disabled={loadingRisk}>
                      {loadingRisk ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Gauge className="w-4 h-4" />
                      )}
                      Scan Health Risks
                    </Button>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 min-h-[30vh]">
                    {riskData ? (
                      <div>{renderFormattedAiContent(riskData)}</div>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-center">
                        <Gauge className="w-10 h-10 text-slate-600 mb-2" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Awaiting Risk Profiling</p>
                        <p className="text-xs text-slate-500 mt-1">Click the button above to run diagnostic forecasts based on laboratory tests.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Tab 8: Chatbot Console */}
            {activeTab === 'chatbot' && (
              <motion.div
                key="chatbot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Card className="p-0 border-white/10 overflow-hidden flex flex-col h-[70vh] bg-gradient-to-b from-white/[0.01] to-transparent">
                  {/* Console Header */}
                  <div className="p-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 bg-aayu-emerald rounded-full animate-ping" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Aayu Chat Assistant</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-300 outline-none cursor-pointer"
                        value={chatLang}
                        onChange={(e) => setChatLang(e.target.value)}
                      >
                        <option value="English" className="bg-slate-900 text-white">English</option>
                        <option value="Hindi" className="bg-slate-900 text-white">Hindi (हिन्दी)</option>
                        <option value="Gujarati" className="bg-slate-900 text-white">Gujarati (ગુજરાતી)</option>
                        <option value="Marathi" className="bg-slate-900 text-white">Marathi (मराठी)</option>
                      </select>
                      
                      <button 
                        onClick={handleClearChat}
                        className="p-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl border border-white/5 transition-colors"
                        title="Clear Conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loadingChat && chatMessages.length === 0 ? (
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-2/3" />
                        <Skeleton className="h-12 w-1/2 ml-auto" />
                        <Skeleton className="h-16 w-3/4" />
                      </div>
                    ) : chatMessages.length > 0 ? (
                      chatMessages.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`flex items-start gap-3.5 max-w-[80%] ${
                            msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 text-white text-xs font-bold flex items-center justify-center ${
                            msg.role === 'user' 
                              ? 'bg-aayu-cyan' 
                              : 'bg-aayu-emerald'
                          }`}>
                            {msg.role === 'user' ? <UserCheck className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                          </div>

                          <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-aayu-cyan/10 border border-aayu-cyan/20 text-white'
                              : 'bg-white/[0.03] border border-white/5 text-slate-300 shadow-lg'
                          }`}>
                            {msg.role === 'assistant' 
                              ? renderFormattedAiContent(msg.content)
                              : msg.content
                            }
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Brain className="w-12 h-12 text-slate-600 mb-2 animate-bounce" />
                        <h4 className="font-extrabold text-white text-base">Chat with Aayu</h4>
                        <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal">
                          Ask me anything about your diagnoses, prescriptions, lab results, or health guidelines. I translate answers on the fly.
                        </p>
                      </div>
                    )}
                    
                    {loadingChat && chatMessages.length > 0 && (
                      <div className="flex items-center gap-3.5 max-w-[80%]">
                        <div className="p-2.5 rounded-xl bg-aayu-emerald text-white">
                          <Brain className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-slate-500 font-semibold italic flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Aayu is thinking...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Send Input */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-3 shrink-0">
                    <input
                      type="text"
                      placeholder="Type your health question here..."
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-aayu-cyan/50 focus:ring-1 focus:ring-aayu-cyan/50 transition-all font-medium"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={loadingChat}
                    />
                    <Button type="submit" disabled={loadingChat || !chatInput.trim()} className="px-5">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </motion.div>
  );
};

export default PatientAiPage;
