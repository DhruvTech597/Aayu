import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={cn(
      "glass-card rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden group",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const Button = ({ children, variant = 'primary', className, size = 'md', ...props }) => {
  const variants = {
    primary: "bg-aayu-emerald hover:bg-aayu-emerald-light text-white shadow-lg shadow-aayu-emerald/20",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white transition-colors duration-200",
    outline: "border border-aayu-emerald/30 text-aayu-emerald hover:bg-aayu-emerald/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cn(
        "rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Input = ({ label, error, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative group">
      <input
        className={cn(
          "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none transition-all group-focus-within:border-aayu-emerald/50 group-focus-within:ring-1 group-focus-within:ring-aayu-emerald/50",
          error && "border-red-500/50 focus:border-red-500/50"
        )}
        {...props}
      />
    </div>
    {error && <p className="text-[10px] font-medium text-red-400 ml-1 uppercase tracking-tight">{error}</p>}
  </div>
);

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-white/10 text-slate-400 border border-white/10",
    success: "bg-aayu-emerald/10 text-aayu-emerald border border-aayu-emerald/20",
    warning: "bg-aayu-saffron/10 text-aayu-saffron border border-aayu-saffron/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    ai: "bg-aayu-cyan/10 text-aayu-cyan border border-aayu-cyan/20",
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant], className)}>
      {children}
    </span>
  );
};

export const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse bg-white/5 rounded-xl", className)} />
);
