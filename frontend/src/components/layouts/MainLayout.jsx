import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-aayu-navy-deep text-white flex transition-all duration-500">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="z-50"
          >
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <main 
        className={`flex-1 p-4 md:p-8 transition-all duration-500 ease-in-out ${
          isSidebarOpen ? (isMobile ? 'ml-0' : 'ml-64') : 'ml-0'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Command Bar (Mobile Only) */}
          {isMobile && (
            <div className="flex items-center justify-between mb-6 p-4 glass-card rounded-2xl">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-lg ai-text-gradient">AAYU OS</h2>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-aayu-emerald/20 rounded-lg text-aayu-emerald"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
