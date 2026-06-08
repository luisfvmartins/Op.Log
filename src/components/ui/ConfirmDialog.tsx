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
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-slate-400 text-sm mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors border border-transparent"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
