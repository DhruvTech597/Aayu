import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { 
  Bell, 
  Menu, 
  ChevronDown, 
  ShieldCheck, 
  LogOut, 
  Settings,
  CalendarClock,
  FileWarning,
  CheckCheck,
  Users
} from 'lucide-react';
import { appointmentApi, reportApi, patientApi } from '../../services/apiService';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const notificationStorageKey = `aayu_read_notifications_${user?._id || 'anonymous'}`;

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotificationsLoading(true);

    try {
      const appointmentParams = user.role === 'doctor' ? { doctorId: user._id } : {};
      const isClinicianOrStaff = ['doctor', 'receptionist', 'admin'].includes(user.role);
      
      const [reportsResult, appointmentsResult, patientsResult] = await Promise.allSettled([
        reportApi.getAll(),
        appointmentApi.getAll(appointmentParams),
        isClinicianOrStaff ? patientApi.search('') : Promise.resolve({ data: { data: { patients: [] } } }),
      ]);
      
      const reports = reportsResult.status === 'fulfilled' ? reportsResult.value.data.data || [] : [];
      const appointments = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data.data || [] : [];
      const patients = patientsResult.status === 'fulfilled' ? patientsResult.value.data.data?.patients || [] : [];
      
      const readIds = new Set(JSON.parse(localStorage.getItem(notificationStorageKey) || '[]'));
      const now = new Date();
      const appointmentPath = user.role === 'receptionist'
        ? '/receptionist/dashboard'
        : user.role === 'doctor'
          ? '/doctor/dashboard'
          : user.role === 'admin'
            ? '/owner/dashboard'
            : '/dashboard';

      const reportNotifications = reports.flatMap((report) => {
        const abnormal = (report.parsedData?.parameters || []).filter((parameter) => (
          parameter.status === 'High' || parameter.status === 'Low'
        ));
        if (abnormal.length === 0) return [];

        return [{
          id: `report-${report._id}`,
          type: 'report',
          title: `${report.reportType || 'Report'} needs review`,
          detail: `${abnormal.length} abnormal value${abnormal.length === 1 ? '' : 's'} for ${report.patientId?.fullName || report.parsedData?.patientName || 'a patient'}`,
          date: report.createdAt,
          path: '/reports',
          unread: !readIds.has(`report-${report._id}`),
        }];
      });

      const appointmentNotifications = appointments.flatMap((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        if (!['scheduled', 'rescheduled'].includes(appointment.status) || appointmentDate < now) return [];

        return [{
          id: `appointment-${appointment._id}`,
          type: 'appointment',
          title: 'Upcoming appointment',
          detail: `${appointment.patientId?.fullName || 'Patient'} on ${appointmentDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`,
          date: appointment.appointmentDate,
          path: appointmentPath,
          unread: !readIds.has(`appointment-${appointment._id}`),
        }];
      });

      const patientNotifications = isClinicianOrStaff
        ? patients.flatMap((patient) => {
            const createdDate = new Date(patient.createdAt);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (createdDate < oneDayAgo) return [];

            return [{
              id: `patient-${patient._id}`,
              type: 'patient',
              title: 'New Patient Registered',
              detail: `${patient.fullName} (${patient.phone}) self-registered. Click to verify.`,
              date: patient.createdAt,
              path: '/patients',
              unread: !readIds.has(`patient-${patient._id}`),
            }];
          })
        : [];

      setNotifications([...reportNotifications, ...appointmentNotifications, ...patientNotifications]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 15));
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [notificationStorageKey, user]);

  useEffect(() => {
    const timeout = window.setTimeout(loadNotifications, 0);
    return () => window.clearTimeout(timeout);
  }, [loadNotifications, location.pathname]);

  const markNotificationsRead = (ids) => {
    const stored = new Set(JSON.parse(localStorage.getItem(notificationStorageKey) || '[]'));
    ids.forEach((id) => stored.add(id));
    localStorage.setItem(notificationStorageKey, JSON.stringify([...stored]));
    setNotifications((current) => current.map((notification) => (
      ids.includes(notification.id) ? { ...notification, unread: false } : notification
    )));
  };

  const openNotification = (notification) => {
    markNotificationsRead([notification.id]);
    setShowNotifications(false);
    navigate(notification.path);
  };

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  // Monitor screen resizing for layout adjustment
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format Page Titles dynamically based on pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Clinic Pulse';
    if (path.startsWith('/patients/register')) return 'Onboard Patient';
    if (path.startsWith('/patients')) return 'Patient Directory';
    if (path.startsWith('/patient/')) return 'Smart Health Card';
    if (path.startsWith('/reports')) return 'Diagnostic Hub';
    if (path.startsWith('/settings')) return 'Workspace Control';
    return 'Aayu OS';
  };

  return (
    <div className="min-h-screen bg-aayu-navy-deep text-white flex overflow-hidden">
      {/* Sidebar navigation backdrop (mobile overlay) */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Mounted inside layout and persists across navigations */}
      <div className="relative z-50">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 256, opacity: 1 }}
              exit={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed lg:relative left-0 top-0 h-screen w-64 z-50`}
            >
              <Sidebar onClose={isMobile ? () => setIsSidebarOpen(false) : null} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 w-full glass-card border-b border-white/5 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Quick Find and Medical Admin Status */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/15 rounded-full text-[10px] text-aayu-emerald font-black uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Doctor Link Active
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowNotifications((current) => !current);
                  loadNotifications();
                }}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors relative group"
              >
                <Bell className="w-4.5 h-4.5 text-slate-300 group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-red-500 rounded-full border border-aayu-navy-deep text-[9px] font-black text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] glass-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Notifications</p>
                          <p className="text-[10px] text-slate-500">{unreadCount} unread</p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markNotificationsRead(notifications.map((notification) => notification.id))}
                            className="p-2 text-slate-400 hover:text-aayu-emerald transition-colors"
                            title="Mark all as read"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notificationsLoading && notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-xs text-slate-500">Loading notifications...</p>
                        ) : notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              onClick={() => openNotification(notification)}
                              className={`w-full px-4 py-3 flex items-start gap-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${notification.unread ? 'bg-aayu-cyan/[0.04]' : ''}`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${
                                notification.type === 'report' 
                                  ? 'bg-red-500/10 text-red-400' 
                                  : notification.type === 'patient' 
                                    ? 'bg-aayu-emerald/10 text-aayu-emerald' 
                                    : 'bg-aayu-cyan/10 text-aayu-cyan'
                              }`}>
                                {notification.type === 'report' 
                                  ? <FileWarning className="w-4 h-4" /> 
                                  : notification.type === 'patient' 
                                    ? <Users className="w-4 h-4" /> 
                                    : <CalendarClock className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <p className="text-xs font-bold text-white flex-1">{notification.title}</p>
                                  {notification.unread && <span className="mt-1 w-2 h-2 rounded-full bg-aayu-cyan shrink-0" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{notification.detail}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-8 text-center text-xs text-slate-500">No active alerts or upcoming appointments.</p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Doctor Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(false);
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex items-center gap-3 p-1.5 pr-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-98"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-aayu-emerald to-aayu-cyan flex items-center justify-center text-white font-black shadow-md text-sm">
                  {user?.name ? user.name[0] : 'D'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-none mb-0.5">{user?.name || 'Medical Admin'}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">
                    {user?.role === 'doctor' 
                      ? 'Clinical Lead' 
                      : user?.role === 'receptionist' 
                        ? 'Lobby Staff' 
                        : user?.role === 'patient' 
                          ? 'Patient Portal' 
                          : 'Admin'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-white/10 shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs font-bold text-white">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link 
                          to="/settings" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                          <Settings className="w-4 h-4" />
                          Account Settings
                        </Link>
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout Session
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Page Workspace Grid */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {/* Framer motion transition wrapper for page navigation updates */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
