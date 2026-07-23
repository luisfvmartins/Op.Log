import { Instagram, Linkedin, History } from 'lucide-react';
import { Modal } from './Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogs?: () => void;
}

export function AboutModal({ isOpen, onClose, onOpenLogs }: AboutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sobre"
    >
      <div className="p-2 sm:p-4 text-[var(--text-secondary)]">
        <p className="text-sm leading-relaxed mb-6">
          O <strong>Op.Log</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente suas operações logísticas e viagens.
        </p>
        
        <div className="bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border)]">
          <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest mb-2 font-mono">Criador</h4>
          <p className="text-base text-[var(--text-primary)] font-medium mb-4">
            Desenvolvido por Luis Martins
          </p>
          
          <div className="flex flex-col gap-3">
            <a 
              href="https://instagram.com/luisfvmartins" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
            >
              <div className="p-2 bg-[var(--bg-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] rounded-md border border-[var(--border)] group-hover:border-[var(--border-hover)]">
                <Instagram className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">@luisfvmartins</span>
            </a>
            <a 
              href="https://linkedin.com/in/luisfvmartins" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
            >
              <div className="p-2 bg-[var(--bg-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] rounded-md border border-[var(--border)] group-hover:border-[var(--border-hover)]">
                <Linkedin className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">/in/luisfvmartins</span>
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
          {onOpenLogs ? (
            <button
              onClick={() => {
                onClose();
                onOpenLogs();
              }}
              className="flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors py-1 px-2 rounded-md hover:bg-[var(--bg-base)]"
              title="Log de Atividades do Sistema"
            >
              <History className="w-3.5 h-3.5" />
              <span>Log do Sistema</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-transparent hover:bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] rounded-md text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
