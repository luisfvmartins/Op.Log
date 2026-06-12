import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 px-4 py-3 rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-[var(--border)] bg-[var(--bg-surface)] min-w-[280px] max-w-[380px]"
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#4CAF7D' }} />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" style={{ color: '#E05252' }} />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" style={{ color: '#5B8FDB' }} />}
            <span className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
