import { Instagram, Linkedin } from 'lucide-react';
import { Modal } from './Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sobre"
    >
      <div className="p-2 sm:p-4 text-slate-600 dark:text-slate-300">
        <p className="text-sm sm:text-base leading-relaxed mb-6">
          O <strong>Op.Log</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente suas operações logísticas e viagens.
        </p>
        
        <div className="bg-slate-100 dark:bg-black/40 p-5 rounded-xl border border-slate-200 dark:border-white/10">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Criador</h4>
          <p className="text-base text-slate-900 dark:text-white font-medium mb-4">
            Desenvolvido por Luis Martins
          </p>
          
          <div className="flex flex-col gap-3">
            <a 
              href="https://instagram.com/luisfvmartins" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                <Instagram className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">@luisfvmartins</span>
            </a>
            <a 
              href="https://linkedin.com/in/luisfvmartins" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                <Linkedin className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">/in/luisfvmartins</span>
            </a>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
