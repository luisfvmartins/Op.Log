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
      <p className="text-[var(--text-secondary)] text-[14px] leading-relaxed mb-6">{description}</p>
      
      {requireInputConfirm && (
        <div className="mb-6">
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
            Digite <span className="font-bold font-mono bg-[var(--bg-subtle)] border border-[var(--border-strong)] px-1.5 py-0.5 rounded text-[var(--text-primary)] select-all ml-1 mr-1">{requireInputConfirm}</span> para confirmar
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-md px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-[var(--text-tertiary)]"
            placeholder={requireInputConfirm}
            autoFocus
          />
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mt-6 pt-4 border-t border-[var(--border-subtle)] gap-3 sm:gap-0">
        <div>
          {secondaryAction && (
             <button
               onClick={() => {
                 if (isValid) {
                   secondaryAction.onClick();
                 }
               }}
               disabled={!isValid}
               className={`w-full sm:w-auto px-4 py-2 text-[13px] font-medium rounded-md transition-colors ${
                 !isValid ? 'border border-[var(--border-strong)] text-[var(--text-tertiary)] bg-[var(--bg-subtle)] cursor-not-allowed opacity-60' :
                 isDestructive 
                   ? 'bg-transparent border border-red-500/30 text-red-600 hover:bg-red-500/10' 
                   : 'bg-transparent border border-[var(--accent-main)]/30 text-[var(--accent-main)] hover:bg-[var(--accent-main)]/10'
               }`}
             >
               {secondaryAction.label}
             </button>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-md transition-colors border border-transparent"
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
            className={`w-full sm:w-auto px-4 py-2 text-[13px] font-medium rounded-md transition-colors ${
              !isValid ? 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] cursor-not-allowed opacity-60 border border-[var(--border-strong)]' :
              isDestructive 
                ? 'bg-red-600 border border-transparent text-white hover:bg-red-700' 
                : 'bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
