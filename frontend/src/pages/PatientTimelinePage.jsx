import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Activity, 
  Pill, 
  FileText, 
  Calendar, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/CommonUI';
import { patientApi } from '../services/apiService';

const PatientTimelinePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await patientApi.getTimeline();
      setEvents(res.data.data.events || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to generate medical timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const getEventIcon = (type) => {
    switch (type) {
      case 'Consultation':
        return <Activity className="w-5 h-5 text-aayu-emerald" />;
      case 'Prescription':
        return <Pill className="w-5 h-5 text-aayu-saffron" />;
      case 'Report':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'Appointment':
        return <Calendar className="w-5 h-5 text-aayu-cyan" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'Consultation': return 'border-aayu-emerald bg-aayu-emerald/5';
      case 'Prescription': return 'border-aayu-saffron bg-aayu-saffron/5';
      case 'Report': return 'border-red-500/20 bg-red-500/[0.03]';
      case 'Appointment': return 'border-aayu-cyan bg-aayu-cyan/5';
      default: return 'border-white/10 bg-white/[0.01]';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-white/5 rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl ml-12" />
        ))}
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
        <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
          <Clock className="w-4 h-4" />
          Clinical Audit Trail
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Medical <span className="text-aayu-emerald">Timeline</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">Chronological overview of consultations, prescriptions, lab results, and schedules.</p>
      </div>

      {/* Timeline List */}
      <div className="relative max-w-3xl">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-aayu-emerald/50 via-white/5 to-transparent" />

        {events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event, idx) => (
              <motion.div
                key={event._id + idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-14 group"
              >
                {/* Timeline node dot */}
                <div className={`absolute left-3.5 top-5 w-5 h-5 rounded-full border-2 border-aayu-navy-deep flex items-center justify-center bg-slate-900 group-hover:scale-115 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.05)]`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    event.type === 'Consultation' ? 'bg-aayu-emerald' : 
                    event.type === 'Prescription' ? 'bg-aayu-saffron' : 
                    event.type === 'Report' ? 'bg-red-400' : 'bg-aayu-cyan'
                  }`} />
                </div>

                {/* Event Card */}
                <Card 
                  className={`p-5 hover:bg-white/5 cursor-pointer border-white/5 group hover:border-white/20 transition-all ${getEventColor(event.type)}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <h4 className="font-extrabold text-white text-base leading-tight">
                          {event.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{event.subtitle}</p>
                      <p className="text-sm text-slate-300 font-semibold truncate max-w-lg">{event.detail}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500 font-bold bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-md">
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/10 max-w-xl mx-auto ml-12">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-extrabold uppercase tracking-wide text-xs">No Medical Timeline Events</p>
            <p className="text-slate-600 text-xs mt-1">History will compile automatically as your clinician records visits.</p>
          </div>
        )}
      </div>

      {/* ---------------- DETAIL MODAL ---------------- */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl"
              onClick={() => setSelectedEvent(null)}
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl glass-card border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  {getEventIcon(selectedEvent.type)}
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">{selectedEvent.title}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedEvent.subtitle}</p>
                  </div>
                </div>
                <button 
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event specific fields */}
              <div className="space-y-6 text-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Date & Time</p>
                  <p className="font-bold text-white">
                    {new Date(selectedEvent.date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>

                {/* Consultation Details */}
                {selectedEvent.type === 'Consultation' && (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Diagnosis Summary</p>
                      <p className="text-slate-300 font-bold leading-relaxed">{selectedEvent.detail}</p>
                    </div>
                    {selectedEvent.notes && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Doctor Instructions</p>
                        <p className="text-slate-400 font-medium leading-relaxed bg-white/[0.01] border border-white/5 p-4 rounded-xl">{selectedEvent.notes}</p>
                      </div>
                    )}
                    {selectedEvent.prescription && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Prescribed Items</p>
                        <p className="text-aayu-emerald font-bold leading-relaxed">{selectedEvent.prescription}</p>
                      </div>
                    )}
                    {selectedEvent.aiSummary && (
                      <div className="p-4 bg-aayu-cyan/5 border border-aayu-cyan/15 rounded-xl">
                        <p className="text-[10px] font-black text-aayu-cyan uppercase tracking-widest mb-1.5">AI Consultation Synopsis</p>
                        <p className="text-slate-300 text-xs italic leading-relaxed">{selectedEvent.aiSummary}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Prescription Details */}
                {selectedEvent.type === 'Prescription' && (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Rx Medications Grid</p>
                      <div className="space-y-2.5">
                        {selectedEvent.medicines && selectedEvent.medicines.map((med, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                            <div>
                              <p className="font-extrabold text-white">{med.name}</p>
                              <p className="text-xs text-slate-500">Dosage: {med.dosage || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-300">{med.frequency}</p>
                              <p className="text-[10px] text-slate-500">Duration: {med.duration || 'N/A'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedEvent.notes && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Dosage notes</p>
                        <p className="text-slate-400 font-medium leading-relaxed bg-white/[0.01] border border-white/5 p-4 rounded-xl">{selectedEvent.notes}</p>
                      </div>
                    )}
                    {selectedEvent.followUpDate && (
                      <div className="flex items-center justify-between p-3 bg-aayu-saffron/5 border border-aayu-saffron/15 rounded-xl">
                        <span className="text-xs font-bold text-slate-400">Scheduled Follow Up</span>
                        <Badge variant="warning">
                          {new Date(selectedEvent.followUpDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    )}
                  </>
                )}

                {/* Report Details */}
                {selectedEvent.type === 'Report' && (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Report Metadata</p>
                      <p className="text-slate-300 font-bold leading-relaxed">{selectedEvent.detail}</p>
                    </div>
                    {selectedEvent.aiSummary && (
                      <div className="p-4 bg-red-500/[0.02] border border-red-500/10 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">AI Laboratory Analysis</p>
                        <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">{selectedEvent.aiSummary}</p>
                      </div>
                    )}
                    {selectedEvent.parsedParameters && selectedEvent.parsedParameters.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5">Biomarkers Tested</p>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedEvent.parsedParameters.map((p, i) => (
                            <div key={i} className="p-2.5 bg-white/[0.01] border border-white/5 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="text-[10px] font-extrabold text-slate-400 truncate w-24">{p.name}</p>
                                <p className="text-xs font-bold text-white">{p.value} {p.unit}</p>
                              </div>
                              <Badge variant={p.status === 'Normal' ? 'success' : 'danger'} className="text-[9px] px-1.5 py-0.5">
                                {p.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Appointment Details */}
                {selectedEvent.type === 'Appointment' && (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Booking Reason</p>
                      <p className="text-slate-300 font-bold leading-relaxed">{selectedEvent.detail}</p>
                    </div>
                    {selectedEvent.notes && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Staff Notes</p>
                        <p className="text-slate-400 font-medium leading-relaxed bg-white/[0.01] border border-white/5 p-4 rounded-xl">{selectedEvent.notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lobby Lifecycle State</p>
                      <Badge variant="default" className="capitalize">{selectedEvent.status}</Badge>
                    </div>
                  </>
                )}

              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-aayu-emerald" />
                  HIPAA Verification Enforced
                </span>
                <span className="font-mono text-[9px]">ID: {selectedEvent._id}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PatientTimelinePage;
