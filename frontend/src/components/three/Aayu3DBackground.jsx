import React from 'react';
import { motion } from 'framer-motion';

const AayuBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-aayu-navy-deep">
      {/* Dynamic Aura 1 - Emerald */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-aayu-emerald/20 blur-[120px]" 
      />

      {/* Dynamic Aura 2 - Cyan */}
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, -60, 0],
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1 
        }}
        className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-aayu-cyan/20 blur-[100px]" 
      />

      {/* Dynamic Aura 3 - Saffron/Soft White */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.3, 0.1],
          x: [0, 20, 0],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2 
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-white/[0.02] blur-[150px]" 
      />

      {/* Medical Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px' 
        }} 
      />
      
      {/* Soft Gradient Overlay to blend edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-aayu-navy-deep" />
    </div>
  );
};

export default AayuBackground;
