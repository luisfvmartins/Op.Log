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
  requireInputConfirm
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
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 pb-2 border-b border-slate-100 dark:border-white/10">{description}</p>
      
      {requireInputConfirm && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Digite <span className="font-bold font-mono bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded text-slate-900 dark:text-white select-all">{requireInputConfirm}</span> para confirmar:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder={requireInputConfirm}
            autoFocus
          />
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            if (isValid) {
              onConfirm();
              onClose();
            }
          }}
          disabled={!isValid}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            !isValid ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed' :
            isDestructive 
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
