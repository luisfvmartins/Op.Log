import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-base)] shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mt-1">Configuração Operacional</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
