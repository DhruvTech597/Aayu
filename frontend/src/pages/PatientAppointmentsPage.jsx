import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ShieldCheck, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/ui/CommonUI';
import { appointmentApi, doctorApi } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const PatientAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  // Reschedule Modal State
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchData = async () => {
    if (!user?.patientId) return;
    try {
      setLoading(true);
      const [appRes, docRes] = await Promise.all([
        appointmentApi.getAll({ patientId: user.patientId }),
        doctorApi.list()
      ]);
      setAppointments(appRes.data.data || []);
      setDoctors(docRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync appointment database records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Book Appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookDate || !bookTime) {
      toast.error('Please complete all required scheduling fields');
      return;
    }
    
    setBooking(true);
    try {
      const dateTime = new Date(`${bookDate}T${bookTime}`);
      await appointmentApi.create({
        patientId: user.patientId,
        doctorId: selectedDoctorId,
        appointmentDate: dateTime.toISOString(),
        reason: reason || 'General Checkup'
      });
      
      toast.success('Appointment scheduled successfully!');
      setSelectedDoctorId('');
      setBookDate('');
      setBookTime('');
      setReason('');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentApi.updateStatus(id, 'cancelled');
      toast.success('Appointment cancelled successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel appointment');
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (app) => {
    setRescheduleAppointmentId(app._id);
    const existingDate = new Date(app.appointmentDate);
    setNewDate(existingDate.toISOString().split('T')[0]);
    setNewTime(existingDate.toTimeString().split(' ')[0].substring(0, 5));
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      toast.error('Please choose a valid date and time');
      return;
    }

    setRescheduling(true);
    try {
      const dateTime = new Date(`${newDate}T${newTime}`);
      await appointmentApi.reschedule(rescheduleAppointmentId, {
        appointmentDate: dateTime.toISOString()
      });
      toast.success('Appointment rescheduled successfully');
      setRescheduleAppointmentId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reschedule appointment');
    } finally {
      setRescheduling(false);
    }
  };

  // Filter Upcoming & History
  const upcomingAppointments = appointments.filter(app => ['pending', 'scheduled', 'rescheduled'].includes(app.status));
  const pastAppointments = appointments.filter(app => ['completed', 'cancelled'].includes(app.status));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/3 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl" />
          <div className="h-96 bg-white/5 rounded-2xl" />
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
        <div className="flex items-center gap-2 text-aayu-cyan font-bold text-xs uppercase tracking-widest">
          <Calendar className="w-4 h-4" />
          Scheduling Control Center
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Appointment <span className="text-aayu-cyan">Management</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">Book consultations, reschedule times slots, and cancel scheduled appointments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Book Appointment Form (Right-ish but let's put it on Left for visual weighting) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active / Scheduled list */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Scheduled Consultations</h3>

            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map((app) => (
                  <Card key={app._id} className="p-6 border-white/15 relative overflow-hidden bg-gradient-to-r from-aayu-navy to-slate-900 shadow-xl group">
                    <div className="absolute top-0 right-0 p-3">
                      <Badge variant={app.status === 'pending' ? 'warning' : 'success'} className="capitalize">{app.status}</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-aayu-cyan/10 text-aayu-cyan rounded-xl flex items-center justify-center font-black text-lg">
                          {app.doctorId?.name ? app.doctorId.name[0] : 'D'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-base leading-tight">Dr. {app.doctorId?.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{app.doctorId?.specialization || 'Clinical Specialist'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Date</p>
                          <p className="font-bold text-white">{new Date(app.appointmentDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Time</p>
                          <p className="font-bold text-white">
                            {new Date(app.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Reason</p>
                          <p className="text-slate-300 font-medium">{app.reason}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-white/5 pt-3">
                        <Button 
                          variant="secondary" 
                          onClick={() => openRescheduleModal(app)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white border border-white/5"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleCancelAppointment(app._id)}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No active schedules found</p>
              </div>
            )}
          </div>

          {/* Past History list */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Consultation History</h3>

            {pastAppointments.length > 0 ? (
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl divide-y divide-white/5">
                {pastAppointments.map((app) => (
                  <div key={app._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${app.status === 'completed' ? 'bg-aayu-emerald/10 text-aayu-emerald' : 'bg-red-500/10 text-red-400'}`}>
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">Dr. {app.doctorId?.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{app.doctorId?.specialization || 'Clinical Lead'} • {app.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-stretch md:self-auto justify-between border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                      <div className="text-slate-400">
                        <p className="font-bold text-white">{new Date(app.appointmentDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(app.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge variant={app.status === 'completed' ? 'success' : 'danger'} className="capitalize">{app.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No appointment history</p>
              </div>
            )}
          </div>

        </div>

        {/* Schedule a Consult Form Panel (Right) */}
        <div className="lg:col-span-4">
          <Card className="p-6 border-white/10 space-y-6 bg-gradient-to-b from-white/[0.01] to-transparent relative overflow-hidden">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Plus className="text-aayu-cyan w-5 h-5 animate-pulse" />
              Book Consultation
            </h3>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Clinician</label>
                <select
                  required
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium cursor-pointer"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="" className="bg-slate-900 text-white">Select Doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id} className="bg-slate-900 text-white">
                      Dr. {doc.name} ({doc.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Date</label>
                <Input 
                  type="date" 
                  value={bookDate} 
                  onChange={(e) => setBookDate(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Time</label>
                <Input 
                  type="time" 
                  value={bookTime} 
                  onChange={(e) => setBookTime(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason / Symptoms</label>
                <Input 
                  placeholder="e.g. Chronic blood pressure checkup"
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  required
                />
              </div>

              <Button 
                type="submit"
                disabled={booking}
                className="w-full py-3.5 bg-aayu-cyan hover:bg-aayu-cyan/85 font-black uppercase text-xs tracking-wider shadow-lg shadow-aayu-cyan/20 mt-4"
              >
                {booking ? 'Scheduling Slot...' : 'Schedule Appointment'}
              </Button>
            </form>
          </Card>
        </div>

      </div>

      {/* ---------------- RESCHEDULE MODAL ---------------- */}
      <AnimatePresence>
        {rescheduleAppointmentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-aayu-navy-deep/80 backdrop-blur-xl"
              onClick={() => setRescheduleAppointmentId(null)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md glass-card border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Clock className="text-aayu-cyan w-5.5 h-5.5" />
                  Reschedule Slot
                </h2>
                <button 
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
                  onClick={() => setRescheduleAppointmentId(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Date</label>
                  <Input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)} 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Time</label>
                  <Input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)} 
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={rescheduling}
                  className="w-full py-3.5 bg-aayu-cyan hover:bg-aayu-cyan/85 font-black uppercase text-xs tracking-wider mt-4"
                >
                  {rescheduling ? 'Rescheduling Slot...' : 'Update Appointment Slot'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default PatientAppointmentsPage;
