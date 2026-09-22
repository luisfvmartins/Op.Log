import { ArrowRight, Globe2, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';

interface DomainMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NEW_DOMAIN = 'https://oplog.luisfvmartins.com';

export function DomainMigrationModal({ isOpen, onClose }: DomainMigrationModalProps) {
  const handleMigrate = () => {
    window.location.href = NEW_DOMAIN;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo endereço do Op.Log">
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-tint)]">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--bg-surface)] border border-[var(--accent-border)] flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              O endereço do sistema foi atualizado
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              O Op.Log está migrando para um endereço próprio, alinhado ao nome e à identidade do sistema.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Endereço atual
            </p>
            <div className="px-3 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg-base)] text-sm font-mono text-[var(--text-tertiary)] break-all">
              transmagna.vercel.app
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] rotate-90" />
          </div>

          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Novo endereço
            </p>
            <div className="px-3 py-2.5 rounded-md border border-[var(--accent-border)] bg-[var(--accent-tint)] text-sm font-mono font-medium text-[var(--text-primary)] break-all">
              oplog.luisfvmartins.com
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent)]" />
          <p>
            O endereço anterior utiliza o nome “Transmagna”, que está associado a uma empresa registrada.
            Para evitar possíveis conflitos de identificação, o sistema passa a utilizar o domínio próprio do Op.Log.
          </p>
        </div>

        <div className="pt-1 space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Seus dados e sua conta permanecem os mesmos.</strong>{' '}
            Apenas o endereço de acesso está sendo alterado.
          </p>
          <div className="px-3.5 py-3 rounded-md border border-[var(--accent-border)] bg-[var(--accent-tint)] text-xs leading-relaxed text-[var(--text-secondary)]">
            <strong className="text-[var(--text-primary)]">Atenção:</strong> o endereço antigo ficará disponível somente até <strong className="text-[var(--text-primary)]">30/09 às 23h59</strong>. Após esse prazo, utilize exclusivamente o novo endereço.
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          >
            Continuar por enquanto
          </button>
          <button
            onClick={handleMigrate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-[#17130A] hover:bg-[var(--accent-hover)] rounded-md text-sm font-semibold transition-colors"
          >
            Acessar novo endereço
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
