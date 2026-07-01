import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Download, 
  Share2, 
  Clock, 
  SlidersHorizontal, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  AlertTriangle
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/ui/CommonUI';
import { reportApi } from '../services/apiService';
import { toast } from 'react-hot-toast';

const PatientReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'

  // Selected Report for detail display
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getAll();
      setReports(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedReport(res.data.data[0]); // default select first
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch medical reports archive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleShare = (reportId) => {
    const shareUrl = `${window.location.origin}/reports/${reportId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Report shareable link copied to clipboard!');
  };

  // Filter reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      (r.reportType && r.reportType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.fileName && r.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeCategory === 'All') return matchesSearch;
    if (activeCategory === 'Lab Reports') {
      return matchesSearch && /cbc|lipid|liver|lft|kidney|kft|thyroid|blood|glucose|sugar|diabetes|hba1c/i.test(r.reportType);
    }
    if (activeCategory === 'Scans') {
      return matchesSearch && /x-ray|mri|ct scan|ultrasound|xray|mri|ct/i.test(r.reportType);
    }
    if (activeCategory === 'Summaries') {
      return matchesSearch && /discharge|summary|notes/i.test(r.reportType);
    }
    return matchesSearch;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

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
        <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
          <FileText className="w-4 h-4" />
          Diagnostics Hub
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Reports <span className="text-red-400">Center</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">Browse laboratory outcomes, imaging profiles, and physician discharge letters.</p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search reports by type..." 
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Toggles */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['All', 'Lab Reports', 'Scans', 'Summaries'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedReport(null); }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-300 ${
                activeCategory === cat 
                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <Clock className="w-4 h-4 text-slate-500" />
          <select 
            className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest" className="bg-aayu-navy text-white">Newest First</option>
            <option value="oldest" className="bg-aayu-navy text-white">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Directory (Left) and Detail View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Reports Directory (Left) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reports Directory</h3>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {sortedReports.length > 0 ? (
              sortedReports.map((report) => (
                <Card 
                  key={report._id}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-all border-white/5 ${
                    selectedReport?._id === report._id 
                      ? 'bg-red-500/5 border-red-500/20 shadow-inner' 
                      : 'hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${selectedReport?._id === report._id ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-400'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-snug truncate w-44">
                        {report.reportType}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No reports found</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Insights Inspector (Right) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-8 border-white/10 space-y-8 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white/[0.01] to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Top summary details */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
                        <FileText className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{selectedReport.reportType}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Record ID: {selectedReport._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => handleShare(selectedReport._id)} className="p-2.5 rounded-xl border border-white/5">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <a 
                        href={reportApi.getOriginalUrl(selectedReport._id)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-red-500/20"
                      >
                        <Download className="w-4 h-4" />
                        Original PDF
                      </a>
                    </div>
                  </div>

                  {/* Core Clinical synopsis */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">File Metadata</p>
                      <p className="text-xs font-bold text-slate-300">File Name: {selectedReport.fileName}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Uploaded Date: {new Date(selectedReport.createdAt).toLocaleString()}</p>
                    </div>

                    {/* AI Laboratory Summary */}
                    {selectedReport.aiSummary ? (
                      <div className="p-6 bg-red-500/[0.02] border border-red-500/10 rounded-2xl space-y-4">
                        <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          AI Report Analysis Synopsis
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-semibold italic">
                          {selectedReport.aiSummary}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                        <p className="text-xs text-slate-500 italic">No AI Analysis compiled for this report yet.</p>
                      </div>
                    )}

                    {/* Extracted Parameters (Biomarkers) */}
                    {selectedReport.parsedData?.parameters && selectedReport.parsedData.parameters.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Biomarkers & Lab Parameters
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedReport.parsedData.parameters.map((p, i) => (
                            <div key={i} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-center">
                              <div className="space-y-1">
                                <p className="text-xs font-extrabold text-slate-400 leading-none">{p.name}</p>
                                <p className="text-sm font-bold text-white tracking-tight">
                                  {p.value} <span className="text-[10px] text-slate-500 font-semibold">{p.unit}</span>
                                </p>
                                {p.referenceRange && (
                                  <p className="text-[9px] text-slate-600 font-bold">Ref: {p.referenceRange}</p>
                                )}
                              </div>

                              <Badge variant={p.status === 'Normal' ? 'success' : 'danger'} className="text-[9px] px-2 py-0.5 capitalize">
                                {p.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HIPAA compliance label */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-aayu-emerald" />
                      HIPAA Protected Diagnostic Record
                    </span>
                    <span className="font-mono text-[9px]">Aayu OS Secure File</span>
                  </div>

                </Card>
              </motion.div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-4">
                <FileText className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Select a report to inspect clinical data</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default PatientReportsPage;
