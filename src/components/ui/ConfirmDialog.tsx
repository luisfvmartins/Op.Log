import { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requireInputConfirm?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  requireInputConfirm,
  secondaryAction
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const isValid = requireInputConfirm
    ? inputValue === requireInputConfirm
    : true;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-[var(--text-secondary)] text-sm mb-6 pb-2 border-b border-[var(--border)]">{description}</p>
      
      {requireInputConfirm && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Digite <span className="font-bold font-mono bg-[var(--bg-base)] border border-[var(--border)] px-1 py-0.5 rounded text-[var(--text-primary)] select-all">{requireInputConfirm}</span> para confirmar:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 font-mono text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#E05252] focus:ring-0"
            placeholder={requireInputConfirm}
            autoFocus
          />
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div>
          {secondaryAction && (
             <button
               onClick={() => {
                 if (isValid) {
                   secondaryAction.onClick();
                 }
               }}
               disabled={!isValid}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                 !isValid ? 'border border-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50' :
                 isDestructive 
                   ? 'bg-transparent border border-[#E05252]/30 text-[#E05252] hover:bg-[#E05252]/10' 
                   : 'bg-transparent border border-[#D4A843]/30 text-[#D4A843] hover:bg-[#D4A843]/10'
               }`}
             >
               {secondaryAction.label}
             </button>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent rounded-md transition-colors border border-transparent"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              if (isValid) {
                onConfirm();
              }
            }}
            disabled={!isValid}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !isValid ? 'border border-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50' :
              isDestructive 
                ? 'bg-transparent border border-[#E05252]/30 text-[#E05252] hover:bg-[#E05252]/10' 
                : 'bg-transparent border border-[var(--accent-border)] text-[var(--accent)] hover:bg-[var(--accent-tint)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
