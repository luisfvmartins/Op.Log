import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border min-w-[300px]",
              toast.type === 'success' && "bg-white dark:bg-[#09090B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white",
              toast.type === 'error' && "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200",
              toast.type === 'info' && "bg-white dark:bg-[#09090B] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
