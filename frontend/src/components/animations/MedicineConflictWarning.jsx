import { motion } from 'framer-motion';
import { AlertTriangle, Pill, X } from 'lucide-react';
import { Card, Badge } from '../ui/CommonUI';
import { cn } from '../../utils/cn';

const MedicineConflictWarning = ({ conflict, onDismiss }) => {
  if (!conflict) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="relative"
    >
      <Card className={cn(
        "border-red-500/50 bg-red-500/10 p-4 relative overflow-hidden",
        "shadow-[0_0_20px_rgba(239,68,68,0.2)]"
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-pulse" />

        <div className="relative z-10 flex gap-4">
          <div className="p-2 bg-red-500 rounded-lg text-white shadow-lg shadow-red-500/40">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-red-400 font-bold flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medicine Interaction Detected
              </h4>
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Dismiss medicine interaction warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {conflict.message}
            </p>

            <div className="mt-3 flex gap-2">
              <Badge variant="danger" className="text-[10px]">High Risk</Badge>
              <Badge variant="secondary" className="text-[10px]">Check Contraindications</Badge>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default MedicineConflictWarning;
