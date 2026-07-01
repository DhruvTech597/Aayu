import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Lock, 
  Eye, 
  Database, 
  CreditCard, 
  Moon, 
  Sun, 
  Save
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui/CommonUI';
import { useAuth } from '../context/AuthContext';
import { authApi, doctorApi } from '../services/apiService';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    specialization: '',
  });
  const [notifications, setNotifications] = useState({
    aiCriticalAlerts: true,
    appointmentReminders: true,
    systemUpdates: false,
  });
  const [theme, setTheme] = useState('dark');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        specialization: user.specialization || '',
      });
      if (user.notificationSettings) {
        setNotifications({
          aiCriticalAlerts: user.notificationSettings.aiCriticalAlerts !== undefined ? user.notificationSettings.aiCriticalAlerts : true,
          appointmentReminders: user.notificationSettings.appointmentReminders !== undefined ? user.notificationSettings.appointmentReminders : true,
          systemUpdates: user.notificationSettings.systemUpdates !== undefined ? user.notificationSettings.systemUpdates : false,
        });
      }
      if (user.themePreference) {
        setTheme(user.themePreference);
      }
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      toast.error("Profile Name and Email Address are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Update general info
      await authApi.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        notificationSettings: notifications,
        themePreference: theme,
      });

      // 2. If user is a doctor, also update doctor profile
      if (user?.role === 'doctor') {
        await doctorApi.updateProfile({
          specialization: profileForm.specialization,
        });
      }

      if (refreshUser) {
        await refreshUser();
      }

      toast.success("Profile settings updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNotification = async (key) => {
    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(updatedNotifications);
    try {
      await authApi.updateProfile({
        notificationSettings: updatedNotifications
      });
      if (refreshUser) {
        await refreshUser();
      }
      toast.success("Notification settings updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notification settings.");
    }
  };

  const handleToggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      await authApi.updateProfile({
        themePreference: nextTheme
      });
      if (refreshUser) {
        await refreshUser();
      }
      toast.success(`Theme preference updated to ${nextTheme} mode.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update theme preference.");
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10 pb-20"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-aayu-emerald font-bold text-xs uppercase tracking-widest">
            <Settings className="w-4 h-4 animate-spin-slow" />
            Clinic Control Center
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            System <span className="text-aayu-emerald">Settings</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">Configure your clinic profile, notification logic, and account settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile}>
              <Card className="p-8 space-y-8 border-white/10 relative overflow-hidden bg-gradient-to-b from-white/[0.01] to-transparent">
                <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-emerald/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-aayu-emerald/20 rounded-xl text-aayu-emerald">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Workspace Credentials</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Role: {user?.role || 'Clinician'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Full Name" 
                    placeholder="Jane Doe" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                  <Input 
                    label="Email Address" 
                    placeholder="jane@clinic.com" 
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                  {user?.role === 'doctor' && (
                    <div className="md:col-span-2">
                      <Input 
                        label="Specialization / Department" 
                        placeholder="e.g. Cardiology, Pediatrics" 
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    className="px-8 py-3.5 gap-2 bg-aayu-emerald hover:bg-aayu-emerald-light text-xs font-black uppercase tracking-wider"
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
                  </Button>
                </div>
              </Card>
            </form>

            <Card className="p-8 space-y-8 border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-aayu-cyan/20 rounded-lg text-aayu-cyan">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Notification Logic</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'AI Critical Alerts', key: 'aiCriticalAlerts', desc: 'Immediate notification for abnormal reports' },
                  { label: 'Appointment Reminders', key: 'appointmentReminders', desc: 'Notify doctor of upcoming patient visits' },
                  { label: 'System Updates', key: 'systemUpdates', desc: 'Notify about new AI model deployments' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <div 
                      onClick={() => handleToggleNotification(item.key)}
                      className={`relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${notifications[item.key] ? 'bg-aayu-emerald' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${notifications[item.key] ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Security & Advanced */}
            <Card className="p-6 border-white/10 bg-aayu-navy/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Security</h3>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 text-xs py-3" onClick={() => toast.success("Access key resets are restricted by clinic policy.")}>
                  <Lock className="w-4 h-4" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 text-xs py-3" onClick={() => toast.success("Starting secure data export stream...")}>
                  <Database className="w-4 h-4" />
                  Export Clinical Data
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 text-xs py-3" onClick={() => toast.success("HIPAA Billing Terminal opened in secure frame.")}>
                  <CreditCard className="w-4 h-4" />
                  Billing & Subscription
                </Button>
              </div>
            </Card>

            <Card className="p-6 border-white/10 bg-aayu-navy/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-aayu-saffron/20 rounded-lg text-aayu-saffron">
                  <Moon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Appearance</h3>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <span className="text-xs font-medium text-slate-400">Dark Mode</span>
                <div 
                  onClick={handleToggleTheme}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-aayu-emerald' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SettingsPage;
