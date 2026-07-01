import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Card, Button, Badge } from '../ui/CommonUI';
import { reportApi } from '../../services/apiService';

const ReportUpload = ({ patientId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle');

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setStatus('uploading');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('report', file);
        formData.append('patientId', patientId);
        
        await reportApi.upload(formData);
      }
      
      setStatus('processing');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStatus('completed');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setStatus('error');
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-white/20 bg-white/5 hover:border-aayu-emerald/50 transition-all group relative overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 bg-aayu-emerald/20 rounded-full flex items-center justify-center text-aayu-emerald mb-4 group-hover:shadow-lg group-hover:shadow-aayu-emerald/30 transition-all"
          >
            <Upload className="w-8 h-8" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Upload Medical Reports</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Drag and drop PDF, JPG, or PNG reports. Our AI will automatically analyze and summarize them.
          </p>
          
          <label className="cursor-pointer bg-aayu-emerald hover:bg-aayu-emerald/80 text-white px-6 py-2 rounded-full font-medium transition-all">
            Select Files
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileSelect} 
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
        </div>
      </Card>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Queue</h4>
            <div className="grid grid-cols-1 gap-3">
              {files.map((file, idx) => (
                <div key={idx} className="glass-card p-3 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm text-white truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={uploadFiles} 
              disabled={uploading}
              className="w-full py-3"
            >
              {uploading ? 'Processing...' : 'Start AI Analysis'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Overlays */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <Card className="max-w-sm w-full text-center p-8 space-y-6 border-aayu-emerald/30">
              {status === 'uploading' && (
                <>
                  <Loader2 className="w-12 h-12 text-aayu-emerald animate-spin mx-auto" />
                  <h3 className="text-xl font-bold text-white">Uploading Reports</h3>
                  <p className="text-slate-400 text-sm">Securely transferring medical data to Aayu Cloud...</p>
                </>
              )}
              {status === 'processing' && (
                <>
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-aayu-cyan/30 rounded-full animate-ping" />
                    <div className="relative w-full h-full bg-aayu-cyan rounded-full flex items-center justify-center">
                      <Sparkles className="text-white w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Analysis in Progress</h3>
                  <p className="text-slate-400 text-sm">Our AI is performing OCR and extracting key health markers...</p>
                </>
              )}
              {status === 'completed' && (
                <>
                  <CheckCircle2 className="w-12 h-12 text-aayu-emerald mx-auto" />
                  <h3 className="text-xl font-bold text-white">Analysis Complete</h3>
                  <p className="text-slate-400 text-sm">Reports have been processed and added to the Smart Health Card.</p>
                  <Button onClick={() => { setStatus('idle'); setFiles([]); }} className="w-full">
                    Done
                  </Button>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Upload Failed</h3>
                  <p className="text-slate-400 text-sm">An error occurred while processing the reports. Please try again.</p>
                  <Button onClick={() => setStatus('idle')} variant="secondary" className="w-full">
                    Try Again
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportUpload;
