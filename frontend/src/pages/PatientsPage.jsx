import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Filter, 
  ArrowRight, 
  User, 
  Phone, 
  Activity,
  ChevronRight,
  Download,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Skeleton } from '../components/ui/CommonUI';
import { patientApi } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const PatientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientApi.search('');
        setPatients(response.data.data.patients || []);
      } catch (error) {
        console.error('Failed to fetch patients', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    (p.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10 pb-20"
      >
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tight">
              Patient <span className="text-aayu-emerald">Directory</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm">Manage and access all clinical records in the system.</p>
          </div>
          {user?.role !== 'doctor' && (
            <Button 
              className="gap-2 px-6 py-3" 
              onClick={() => navigate('/patients/register')}
            >
              <UserPlus className="w-5 h-5" />
              Onboard New Patient
            </Button>
          )}
        </div>

        {/* Filter & Search Hub */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-aayu-emerald transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, phone or ABHA ID..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-aayu-emerald/50 focus:ring-1 focus:ring-aayu-emerald/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="secondary" className="gap-2 px-6 py-4">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </Button>
        </div>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient, idx) => (
              <motion.div 
                key={patient._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className="group p-6 border-white/5 hover:border-aayu-emerald/30 cursor-pointer transition-all duration-300"
                  onClick={() => navigate(`/patient/${patient._id}`)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-aayu-emerald to-aayu-cyan flex items-center justify-center text-white font-black text-xl shadow-lg shadow-aayu-emerald/20 group-hover:rotate-6 transition-transform">
                        {patient.fullName ? patient.fullName[0] : ''}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-aayu-emerald transition-colors leading-tight">
                          {patient.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{patient.phone}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      {patient.age} Years • {patient.gender}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Activity className="w-3 h-3" />
                      {patient.bloodGroup || 'N/A'}-Blood Group
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 col-span-2 border-t border-white/5 pt-2">
                      <Stethoscope className="w-3.5 h-3.5 text-aayu-emerald" />
                      <span className="font-semibold text-slate-300">Dr. {patient.assignedDoctor || 'Not Assigned'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <Badge variant="success">Active</Badge>
                    <div className="flex items-center gap-1 text-xs font-bold text-aayu-emerald group-hover:translate-x-1 transition-transform">
                      View Card <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-24 glass-card rounded-3xl border-dashed border-2 border-white/10">
              <div className="p-4 bg-white/5 rounded-full inline-block text-slate-500 mb-4">
                <Search className="w-10 h-10" />
              </div>
              <p className="text-slate-400 font-bold text-lg">No matching patients found</p>
              <p className="text-slate-600 text-sm">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default PatientsPage;
