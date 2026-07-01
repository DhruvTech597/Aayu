import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Activity, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Badge } from '../components/ui/CommonUI';
import { toast } from 'react-hot-toast';
import Aayu3DBackground from '../components/three/Aayu3DBackground';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submittingContact, setSubmittingContact] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all contact fields.");
      return;
    }
    setSubmittingContact(true);
    setTimeout(() => {
      toast.success("Thank you! Our clinical operations team will contact you shortly.");
      setContactForm({ name: '', email: '', message: '' });
      setSubmittingContact(false);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-aayu-navy-deep text-white overflow-x-hidden">
      <Aayu3DBackground />

      {/* --- PREMIUM NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-aayu-navy-deep/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-aayu-emerald to-aayu-cyan rounded-xl flex items-center justify-center shadow-lg shadow-aayu-emerald/30">
              <Sparkles className="text-white w-5 h-5 animate-pulse" />
            </div>
            <span className="text-2xl font-black tracking-wider text-white">
              Aayu <span className="text-aayu-emerald">Healthcare</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About Us</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-aayu-emerald hover:bg-aayu-emerald-light text-white text-xs font-black uppercase tracking-wider rounded-xl py-3 px-6 shadow-lg shadow-aayu-emerald/20 animate-pulse"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold uppercase py-2.5 px-5 text-slate-300 hover:text-white"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-aayu-emerald hover:bg-aayu-emerald-light text-white text-xs font-black uppercase tracking-wider rounded-xl py-3 px-6 shadow-lg shadow-aayu-emerald/20"
                >
                  Register Workspace
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-0 w-full bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 z-40 p-6 flex flex-col gap-6 md:hidden"
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase text-slate-300">Features</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase text-slate-300">About Us</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase text-slate-300">Contact</a>
            <hr className="border-white/5" />
            <div className="flex gap-4">
              {isAuthenticated ? (
                <Button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} 
                  className="flex-1 py-3 bg-aayu-emerald text-xs font-black uppercase"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="flex-1 py-3 text-xs">Sign In</Button>
                  <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="flex-1 py-3 bg-aayu-emerald text-xs">Register</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-aayu-emerald/10 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-aayu-emerald/10 border border-aayu-emerald/20 text-aayu-emerald font-black uppercase text-[10px] tracking-widest rounded-full">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            AI-Enforced Biometric Telemetry Network
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Integrated Clinical <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aayu-emerald to-aayu-cyan">
              Biometric Operating System
            </span>
          </h1>

          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Unify doctor consultations, patient onboarding, live checked-in waiting lobby queues, and high-fidelity clinical analytics in a secure HIPAA-compliant workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="w-full sm:w-auto bg-gradient-to-r from-aayu-emerald to-aayu-cyan hover:scale-[1.02] active:scale-95 text-white font-black uppercase tracking-wider text-xs px-8 py-4.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-aayu-emerald/15"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Access Workspace Gateway'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            {!isAuthenticated && (
              <Button 
                variant="secondary"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4.5 text-xs font-bold uppercase tracking-wider rounded-2xl"
              >
                Onboard Clinic
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* --- CLINICAL ROLE GATEWAY OPTIONS CARD --- */}
      <section className="py-10 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 border-white/5 hover:border-aayu-emerald/30 bg-slate-900/40 relative overflow-hidden transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-emerald/5 rounded-full blur-2xl group-hover:bg-aayu-emerald/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-12 h-12 bg-aayu-emerald/10 text-aayu-emerald rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-aayu-emerald transition-colors">Clinician & Doctor Dashboard</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Log symptoms, perform OCR telemetry extractions, prescribe digital signatures, track AI-Clinical Indexes, and schedule direct patient follow-ups.
              </p>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => navigate('/login?role=doctor')} variant="outline" className="flex-1 text-xs py-3">
                  Log In
                </Button>
                <Button onClick={() => navigate('/register?role=doctor')} variant="outline" className="flex-1 text-xs py-3 border-dashed">
                  Register
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-white/5 hover:border-aayu-cyan/30 bg-slate-900/40 relative overflow-hidden transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-cyan/5 rounded-full blur-2xl group-hover:bg-aayu-cyan/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-12 h-12 bg-aayu-cyan/10 text-aayu-cyan rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-aayu-cyan transition-colors">Lobby Receptionist Desk</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Supervise checked-in lobbies, organize live waiting queue tables, schedule doctor bookings, onboard biometric patient files, and assign resident clinicians.
              </p>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => navigate('/login?role=receptionist')} variant="outline" className="flex-1 text-xs py-3 hover:border-aayu-cyan/50 hover:text-aayu-cyan">
                  Log In
                </Button>
                <Button onClick={() => navigate('/register?role=receptionist')} variant="outline" className="flex-1 text-xs py-3 hover:border-aayu-cyan/50 hover:text-aayu-cyan border-dashed">
                  Register
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-white/5 hover:border-aayu-saffron/30 bg-slate-900/40 relative overflow-hidden transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-saffron/5 rounded-full blur-2xl group-hover:bg-aayu-saffron/10 transition-colors" />
            <div className="space-y-4">
              <div className="w-12 h-12 bg-aayu-saffron/10 text-aayu-saffron rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-aayu-saffron transition-colors">Patient Health Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Access your digital Smart Health Card, review chronological timelines, download lab reports, and schedule medical appointments.
              </p>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => navigate('/login?role=patient')} variant="outline" className="flex-1 text-xs py-3 hover:border-aayu-saffron/50 hover:text-aayu-saffron">
                  Log In
                </Button>
                <Button onClick={() => navigate('/register?role=patient')} variant="outline" className="flex-1 text-xs py-3 hover:border-aayu-saffron/50 hover:text-aayu-saffron border-dashed">
                  Register
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-aayu-emerald uppercase tracking-widest">Medical Capabilities</h2>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Integrated Telemetry Workspace</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Digitizing clinics through high-fidelity electronic medical workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Smart Health Cards", desc: "View detailed biometric dossiers, critical allergy reports, chronic illnesses, and chronologically indexed visit histories.", icon: Users, color: "text-aayu-cyan" },
            { title: "OCR Laboratory Extraction", desc: "Process blood counts, urine tests, or thyroid panels using dynamic OCR scanners and Groq AI Clinical LLM synthesizers.", icon: FileText, color: "text-aayu-emerald" },
            { title: "Executive Operations Ledgers", desc: "Verify revenue indexes, follow-up conversion charts, clinical staff performance ratings, and download CSV/PDF audit files.", icon: Activity, color: "text-aayu-saffron" }
          ].map((item, idx) => (
            <Card key={idx} className="p-8 border-white/5 hover:border-white/15 bg-white/[0.01] transition-all">
              <div className="space-y-4">
                <div className={`p-3 bg-white/[0.02] rounded-xl w-fit ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* --- ABOUT US SECTION --- */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto">
        <Card className="p-8 md:p-16 border-white/5 bg-gradient-to-b from-slate-900 via-aayu-navy to-slate-900 overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-aayu-emerald/5 rounded-full blur-[100px]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-xs text-slate-300 font-bold uppercase tracking-wider rounded-lg">
                <Shield className="w-4 h-4 text-aayu-emerald" />
                Security Standards
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Designed to automate and secure modern clinical workspaces.
              </h2>
              
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Aayu Healthcare delivers robust biometric and diagnostic ledger management for clinicians. Built on top-tier security standards, we encrypt medical transactions, verify digital prescription signatures, and automate OCR ingestion processes to eliminate clinical friction.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "End-to-End Encrypted Professional Sessions",
                  "Direct Clinic Network Authorization Shields",
                  "Fully Audit-Ready Prescriptions Slips"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                    <CheckCircle className="w-4 h-4 text-aayu-emerald" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-aayu-emerald to-aayu-cyan rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="glass-card p-8 border border-white/10 rounded-3xl bg-slate-950/50 space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Telemetry Statistics</span>
                  <Badge variant="success">Online</Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 text-xs">Biometrics Processed Today</span>
                    <h4 className="text-3xl font-black text-white mt-1">14,802 <span className="text-xs text-aayu-emerald font-bold">+12%</span></h4>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">AI Summary Accuracy Index</span>
                    <h4 className="text-3xl font-black text-white mt-1">99.8% <span className="text-xs text-aayu-cyan font-bold">Llama-3.3</span></h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* --- CONTACT US FORM --- */}
      <section id="contact" className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xs font-bold text-aayu-cyan uppercase tracking-widest">Connect Desk</h2>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Initiate Clinic Integrations
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-medium">
            Ready to integrate Aayu OS into your resident network? Connect with our biometric engineers to get customized on-premises hardware and HIPAA dashboards.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <div className="p-2.5 bg-white/5 rounded-xl text-aayu-cyan"><Mail className="w-4 h-4" /></div>
              operations@aayu-clinical.com
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <div className="p-2.5 bg-white/5 rounded-xl text-aayu-cyan"><Phone className="w-4 h-4" /></div>
              +91 (11) 2345 6789
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <div className="p-2.5 bg-white/5 rounded-xl text-aayu-cyan"><MapPin className="w-4 h-4" /></div>
              Biomedical Enclave, New Delhi, India
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-8 md:p-10 border-white/10 bg-slate-950/40 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-aayu-cyan/5 rounded-full blur-2xl" />
            <form onSubmit={handleContactSubmit} className="space-y-4 relative z-10">
              <Input 
                label="Full Contact Name" 
                placeholder="Dr. Rajesh Kumar" 
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              />
              <Input 
                label="Corporate Hospital Email" 
                type="email" 
                placeholder="rajesh@maxhealthcare.com" 
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inquiry Details</label>
                <textarea 
                  rows="4" 
                  placeholder="Tell us about your clinic setup..."
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium leading-relaxed"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                disabled={submittingContact}
                className="w-full py-4 bg-aayu-cyan hover:bg-aayu-cyan/80 text-xs font-black uppercase tracking-wider"
              >
                {submittingContact ? 'Submitting Inquiry...' : 'Submit Inquiry'}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600 font-medium">
        <p>© 2026 Aayu Healthcare Biometric Ledger Systems. All rights reserved.</p>
        <p className="text-[10px] uppercase font-bold text-slate-700 tracking-wider mt-2">End-to-End HIPAA Enforced Network Protocol</p>
      </footer>
    </div>
  );
};

export default LandingPage;
