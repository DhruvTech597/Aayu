import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Sparkles,
  X,
  TrendingUp,
  Pill,
  Calendar,
  Brain
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [];
  if (user?.role === 'admin') {
    menuItems.push(
      { icon: LayoutDashboard, label: 'Dashboard', path: '/owner/dashboard' },
      { icon: TrendingUp, label: 'Analytics', path: '/owner/analytics' },
      { icon: Users, label: 'Patients', path: '/patients' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    );
  } else if (user?.role === 'receptionist') {
    menuItems.push(
      { icon: LayoutDashboard, label: 'Dashboard', path: '/receptionist/dashboard' },
      { icon: Users, label: 'Patients', path: '/patients' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    );
  } else if (user?.role === 'patient') {
    menuItems.push(
      { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard' },
      { icon: Sparkles, label: 'Smart Health Card', path: '/patient/card' },
      { icon: Users, label: 'Medical Timeline', path: '/patient/timeline' },
      { icon: FileText, label: 'Reports Center', path: '/patient/reports' },
      { icon: Pill, label: 'Prescriptions', path: '/patient/prescriptions' },
      { icon: Calendar, label: 'Appointments', path: '/patient/appointments' },
      { icon: Brain, label: 'AI Health Suite', path: '/patient/ai' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    );
  } else {
    // doctor
    menuItems.push(
      { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard' },
      { icon: Users, label: 'Patients', path: '/patients' },
      { icon: Pill, label: 'Prescriptions', path: '/doctor/prescriptions' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    );
  }

  return (
    <motion.div 
      className="fixed left-0 top-0 h-screen w-64 glass-card border-r border-white/10 z-50 flex flex-col"
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-aayu-emerald rounded-xl flex items-center justify-center shadow-lg shadow-aayu-emerald/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold ai-text-gradient">
            Aayu
          </h1>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            onClick={() => onClose && onClose()}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              location.pathname === item.path 
                ? 'bg-aayu-emerald/10 text-aayu-emerald border border-aayu-emerald/20 shadow-inner' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${location.pathname === item.path ? 'text-aayu-emerald' : 'group-hover:text-white'}`} />
            <span className="font-semibold text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
