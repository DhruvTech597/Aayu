import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={cn(
      "glass-card rounded-2xl p-6 border border-aayu-border shadow-xl relative overflow-hidden group",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const Button = ({ children, variant = 'primary', className, size = 'md', ...props }) => {
  const variants = {
    primary: "bg-aayu-emerald hover:bg-aayu-emerald-light text-white shadow-lg shadow-aayu-emerald/25 hover:shadow-aayu-emerald/40",
    secondary: "bg-white/5 hover:bg-white/10 text-aayu-text-primary border border-aayu-border backdrop-blur-md hover:border-aayu-emerald/30",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "hover:bg-white/5 text-aayu-text-secondary hover:text-aayu-text-primary transition-colors duration-200",
    outline: "border border-aayu-emerald/30 text-aayu-emerald hover:bg-aayu-emerald/10",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg",
    md: "px-5 py-3 text-xs font-black tracking-widest uppercase rounded-xl",
    lg: "px-7 py-4 text-sm font-black tracking-widest uppercase rounded-2xl",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        "font-sans transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer",
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

export const Input = forwardRef(({ label, error, type, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2 w-full text-left">
      {label && (
        <label className="text-[10px] font-bold text-aayu-text-secondary uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          ref={ref}
          type={inputType}
          className={cn(
            "w-full bg-white/[0.02] border border-aayu-border rounded-xl px-4 py-3.5 text-xs text-aayu-text-primary outline-none transition-all group-focus-within:border-aayu-emerald/60 group-focus-within:ring-1 group-focus-within:ring-aayu-emerald/60 font-semibold placeholder-slate-500",
            isPassword && "pr-12",
            error && "border-red-500/50 focus:border-red-500/50"
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-aayu-text-primary transition-colors duration-200 cursor-pointer"
          >
            {showPassword ? (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-[10px] font-medium text-red-500 ml-1 uppercase tracking-tight">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-white/10 text-aayu-text-secondary border border-aayu-border",
    success: "bg-aayu-emerald/10 text-aayu-emerald border border-aayu-emerald/20",
    warning: "bg-aayu-saffron/10 text-aayu-saffron border border-aayu-saffron/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20",
    ai: "bg-aayu-cyan/10 text-aayu-cyan border border-aayu-cyan/20",
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", variants[variant], className)}>
      {children}
    </span>
  );
};

export const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse bg-white/5 rounded-xl", className)} />
);
