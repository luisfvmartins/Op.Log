import React, { useState, useEffect } from 'react';
import { X, History, RefreshCw, Calendar, Tag, Lock } from 'lucide-react';
import { getSystemLogs, SystemLog, ActionType } from '../../services/activityLog';
import { useAuth } from '../../contexts/AuthContext';

interface SystemLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemLogsModal: React.FC<SystemLogsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getSystemLogs(user?.uid);
      setLogs(data);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, user?.uid]);

  if (!isOpen) return null;

  const getActionBadgeClass = (action: ActionType) => {
    switch (action) {
      case 'Inclusão':
        return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20';
      case 'Edição':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Exclusão':
        return 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20';
      case 'Criação de Roteiro':
        return 'bg-[var(--accent-tint)] text-[var(--accent)] border border-[var(--accent)]/30';
      case 'Importação':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
      default:
        return 'bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-w-3xl w-full h-[80vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Log de Atividades</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-tertiary)] flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-emerald-500" />
                  Inalterável
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] font-mono">
                Registros com data e horário completo (últimas 1.000 alterações)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors hover:bg-[var(--bg-base)]"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors hover:bg-[var(--bg-base)]"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-auto p-4 bg-[var(--bg-base)] space-y-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] space-y-2">
              <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Carregando registros...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] p-6 text-center space-y-2">
              <History className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">Nenhum registro de log encontrado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 text-xs flex flex-col gap-1.5 transition-colors hover:border-[var(--border-hover)]"
                >
                  {/* Top Bar: Timestamp, Action, Module */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${getActionBadgeClass(log.actionType)}`}>
                        {log.actionType}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-base)] px-2 py-0.5 rounded border border-[var(--border)]">
                        <Tag className="w-2.5 h-2.5" />
                        {log.module}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)]">
                      <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                      <span>{log.formattedDate}</span>
                    </div>
                  </div>

                  {/* Description & Details */}
                  <div className="pt-0.5">
                    <p className="font-medium text-[var(--text-primary)] leading-snug">{log.description}</p>
                    {log.details && (
                      <p className="text-[11px] text-[var(--text-tertiary)] font-mono mt-1 bg-[var(--bg-base)]/60 p-1.5 rounded border border-[var(--border)]/40">
                        {log.details}
                      </p>
                    )}
                  </div>

                  {/* User Email Footer */}
                  {log.userEmail && (
                    <div className="text-[10px] text-[var(--text-tertiary)] font-mono text-right pt-0.5">
                      Usuário: {log.userEmail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-xs text-[var(--text-tertiary)] font-mono shrink-0">
          <span>{logs.length} registro(s) mantidos (máx. 1.000)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--bg-base)] border border-[var(--border)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-md text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
