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
  Menu,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Badge } from '../components/ui/CommonUI';
import { toast } from 'react-hot-toast';
import Aayu3DBackground from '../components/three/Aayu3DBackground';
import { useAuth } from '../context/AuthContext';
import heroMedical from '../assets/hero_medical.png';

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
    <div className="relative min-h-screen bg-aayu-navy-deep text-aayu-text-primary overflow-x-hidden">
      <Aayu3DBackground />

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-aayu-navy-deep/80 backdrop-blur-xl border-b border-aayu-border py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-aayu-emerald rounded-xl flex items-center justify-center shadow-lg shadow-aayu-emerald/25">
              <Sparkles className="text-white w-5 h-5 animate-pulse" />
            </div>
            <span className="text-lg font-black tracking-widest text-white uppercase">
              Aayu <span className="text-aayu-emerald-light">OS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#about" className="hover:text-white transition-colors">Security</a>
            <a href="#contact" className="hover:text-white transition-colors">Inquiries</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="animate-pulse"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                >
                  Register Workspace
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="fixed top-16 left-0 w-full bg-aayu-surface/95 backdrop-blur-2xl border-b border-aayu-border z-40 p-6 flex flex-col gap-6 md:hidden"
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-wider text-slate-400">Capabilities</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-wider text-slate-400">Security</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-wider text-slate-400">Inquiries</a>
            <hr className="border-aayu-border" />
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <Button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full">Sign In</Button>
                  <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="w-full">Register</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-36 pb-12 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="space-y-6 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-aayu-emerald/5 border border-aayu-emerald/10 text-aayu-emerald font-black uppercase text-[9px] tracking-widest rounded-full">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Clinical Biometric Operating System
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Integrated Clinical <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aayu-emerald to-aayu-cyan">
              Biometric Platform
            </span>
          </h1>

          <p className="text-slate-400 text-sm font-semibold leading-relaxed">
            Unify doctor consultations, patient onboarding, waiting lobbies, and high-fidelity clinical analytics in a secure, audit-ready HIPAA-compliant space.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="w-full sm:w-auto text-xs px-6 py-4 shadow-xl shadow-aayu-emerald/10"
              size="lg"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Access Workspace'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            {!isAuthenticated && (
              <Button 
                variant="secondary"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto text-xs px-6 py-4"
                size="lg"
              >
                Onboard Clinic
              </Button>
            )}
          </div>
        </div>

        {/* Hero Visual Showcase */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full lg:max-w-xl aspect-[4/3] rounded-3xl overflow-hidden border border-aayu-border group"
        >
          <img 
            src={heroMedical} 
            alt="Clinical Dashboard Illustration" 
            className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-transform duration-700 brightness-[0.8] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-aayu-navy-deep/80 via-transparent to-transparent" />
        </motion.div>
      </section>

      {/* --- CLINICAL ROLE GATEWAYS --- */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 bg-aayu-surface border border-aayu-border hover:border-aayu-emerald/20 transition-all">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-aayu-emerald/10 text-aayu-emerald rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Clinician Dashboard</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Log symptoms, perform OCR telemetry extractions, prescribe digital signatures, and track clinical insights.
              </p>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => navigate('/login?role=doctor')} variant="outline" className="flex-1 text-[9px] py-3">
                  Log In
                </Button>
                <Button onClick={() => navigate('/register?role=doctor')} variant="outline" className="flex-1 text-[9px] py-3 border-dashed">
                  Register
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-aayu-surface border border-aayu-border hover:border-aayu-cyan/20 transition-all">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-aayu-cyan/10 text-aayu-cyan rounded-2xl flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Lobby Receptionist Desk</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Supervise checked-in lobbies, organize waiting queues, schedule bookings, and onboard biometric patient files.
              </p>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => navigate('/login?role=receptionist')} variant="outline" className="flex-1 text-[9px] py-3 hover:border-aayu-cyan/40 hover:text-aayu-cyan">
                  Log In
                </Button>
                <Button onClick={() => navigate('/register?role=receptionist')} variant="outline" className="flex-1 text-[9px] py-3 hover:border-aayu-cyan/40 hover:text-aayu-cyan border-dashed">
                  Register
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-aayu-surface border border-aayu-border hover:border-aayu-saffron/20 transition-all">
            <div className="space-y-4">
              <div className="w-11 h-11 bg-aayu-saffron/10 text-aayu-saffron rounded-2xl flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Patient Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Access your digital Smart Health Card, review chronological timelines, download lab reports, and manage bookings.
              </p>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => navigate('/login?role=patient')} variant="outline" className="flex-1 text-[9px] py-3 hover:border-aayu-saffron/40 hover:text-aayu-saffron">
                  Log In
                </Button>
                <Button onClick={() => navigate('/register?role=patient')} variant="outline" className="flex-1 text-[9px] py-3 hover:border-aayu-saffron/40 hover:text-aayu-saffron border-dashed">
                  Register
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="success">Capabilities</Badge>
          <h2 className="text-3xl font-black text-white tracking-tight">Telemetry Workspace Integrations</h2>
          <p className="text-slate-400 text-xs font-semibold max-w-md mx-auto">Digitizing clinics through high-fidelity electronic medical workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Smart Health Cards", desc: "View detailed biometric dossiers, critical allergy reports, chronic illnesses, and chronologically indexed visit histories.", icon: Users, color: "text-aayu-cyan" },
            { title: "OCR Laboratory Extraction", desc: "Process blood counts, urine tests, or thyroid panels using dynamic OCR scanners and AI Clinical synthesizers.", icon: FileText, color: "text-aayu-emerald" },
            { title: "Operations Ledgers", desc: "Verify revenue indexes, follow-up conversion charts, clinical staff performance ratings, and download audit files.", icon: Activity, color: "text-aayu-saffron" }
          ].map((item, idx) => (
            <Card key={idx} className="p-8 border border-aayu-border bg-white/[0.01] hover:bg-white/[0.03] transition-all">
              <div className="space-y-4">
                <div className={`p-3 bg-white/[0.02] border border-aayu-border rounded-xl w-fit ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-md font-bold text-white">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* --- SECURITY STANDARDS --- */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto">
        <Card className="p-8 md:p-16 border border-aayu-border bg-aayu-surface overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-aayu-emerald/5 rounded-full blur-[100px]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-aayu-border text-[9px] text-slate-300 font-black uppercase tracking-widest rounded-lg">
                <Shield className="w-3.5 h-3.5 text-aayu-emerald" />
                HIPAA Audit Standards
              </div>
              
              <h2 className="text-3xl font-black text-white leading-tight">
                Designed to automate and secure modern clinical workspaces.
              </h2>
              
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Aayu OS delivers robust biometric and diagnostic ledger management for clinicians. Built on top-tier security standards, we encrypt medical transactions, verify digital signatures, and automate OCR ingestion processes to eliminate clinical friction.
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
              <div className="glass-card p-8 border border-aayu-border rounded-3xl bg-slate-950/40 space-y-6 relative z-10 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Telemetry Statistics</span>
                  <Badge variant="success">Online</Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold">Biometrics Processed Today</span>
                    <h4 className="text-2xl font-black text-white mt-1">14,802 <span className="text-xs text-aayu-emerald font-bold">+12%</span></h4>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold">AI Summary Accuracy Index</span>
                    <h4 className="text-2xl font-black text-white mt-1">99.8% <span className="text-xs text-aayu-cyan font-bold">Llama-3.3</span></h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* --- CONTACT US FORM --- */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6 text-left">
          <Badge variant="ai">Connect Desk</Badge>
          <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
            Initiate Clinic Integration
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Ready to integrate Aayu OS into your resident network? Connect with our biometric engineers to get customized on-premises hardware and HIPAA dashboards.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <div className="p-2.5 bg-white/5 border border-aayu-border rounded-xl text-aayu-cyan"><Mail className="w-4 h-4" /></div>
              operations@aayu-clinical.com
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <div className="p-2.5 bg-white/5 border border-aayu-border rounded-xl text-aayu-cyan"><Phone className="w-4 h-4" /></div>
              +91 (11) 2345 6789
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <div className="p-2.5 bg-white/5 border border-aayu-border rounded-xl text-aayu-cyan"><MapPin className="w-4 h-4" /></div>
              Biomedical Enclave, New Delhi, India
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-8 md:p-10 border border-aayu-border bg-slate-950/20 rounded-3xl relative overflow-hidden">
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
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-aayu-text-secondary uppercase tracking-widest ml-1">Inquiry Details</label>
                <textarea 
                  rows="4" 
                  placeholder="Tell us about your clinic setup..."
                  className="w-full bg-white/[0.02] border border-aayu-border rounded-xl p-4 text-xs text-white outline-none focus:border-aayu-cyan/50 font-medium leading-relaxed"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                disabled={submittingContact}
                className="w-full py-4 text-xs font-black uppercase tracking-wider"
              >
                {submittingContact ? 'Submitting Inquiry...' : 'Submit Inquiry'}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-aayu-border py-8 text-center text-xs text-slate-500 font-semibold bg-aayu-surface/50">
        <p>© 2026 Aayu Healthcare Biometric Ledger Systems. All rights reserved.</p>
        <p className="text-[9px] uppercase font-bold text-slate-600 tracking-wider mt-2">End-to-End HIPAA Enforced Network Protocol</p>
      </footer>
    </div>
  );
};

export default LandingPage;
