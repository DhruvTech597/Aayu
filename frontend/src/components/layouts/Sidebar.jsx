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
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-64 bg-aayu-surface border-r border-aayu-border z-50 flex flex-col"
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-aayu-emerald rounded-xl flex items-center justify-center shadow-lg shadow-aayu-emerald/25">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black ai-text-gradient tracking-widest uppercase">
            Aayu
          </h1>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-aayu-text-secondary hover:text-aayu-text-primary lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => onClose && onClose()}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-aayu-emerald/10 text-aayu-emerald border border-aayu-emerald/15 shadow-inner font-bold' 
                  : 'text-aayu-text-secondary hover:bg-white/[0.03] hover:text-aayu-text-primary'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-aayu-emerald' : 'text-slate-500 group-hover:text-aayu-text-primary'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-aayu-border">
        <button 
          onClick={logout}
          className="flex items-center gap-3.5 px-4 py-3.5 w-full rounded-xl text-aayu-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Logout Session</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
