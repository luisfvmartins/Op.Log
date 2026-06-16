import { Upload, Download, Sun, Moon, Info, LogOut, LayoutGrid, List as ListIcon, Search, Plus } from 'lucide-react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface UnifiedHeaderProps {
  title: string;
  subtitle: string;
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOptions: { value: string; label: string }[];
  onOpenModal: () => void;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  logout?: () => void;
  setAboutModalOpen?: (v: boolean) => void;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
  selectedIds?: Set<string>;
  toggleSelectAll?: () => void;
  searchPlaceholder?: string;
  onDeleteSelected?: () => void;
}

export function UnifiedHeader({
  title,
  subtitle,
  totalCount,
  filteredCount,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sortOptions,
  onOpenModal,
  buttonText,
  buttonIcon = <Plus className="w-3.5 h-3.5 shrink-0" />,
  theme,
  toggleTheme,
  logout,
  setAboutModalOpen,
  onImport,
  onExport,
  selectedIds,
  toggleSelectAll,
  searchPlaceholder = "Pesquisar...",
  onDeleteSelected
}: UnifiedHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-30 flex flex-col bg-[var(--bg-base)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] shrink-0">
      <div className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Title Area */}
        <div className="flex flex-col select-none border-l-[3px] border-[var(--accent-main)] pl-3">
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)] leading-none">{title}</h1>
          {subtitle && <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">{subtitle}</p>}
        </div>

        {/* Controls Area */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar sm:overflow-visible">
          
          <div className="relative group w-48 sm:w-56 shrink-0 h-8">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-primary)] transition-colors" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-full bg-[var(--bg-surface)] border border-[var(--border-strong)] hover:border-[var(--text-tertiary)] focus:border-[var(--accent-main)] rounded shadow-sm pl-8 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="relative border border-[var(--border-strong)] hover:border-[var(--text-tertiary)] bg-[var(--bg-surface)] shadow-sm rounded flex-shrink-0 transition-all focus-within:border-[var(--accent-main)] h-8">
             <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-transparent pl-3 pr-7 h-full text-[13px] text-[var(--text-primary)] font-medium cursor-pointer focus:outline-none"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-[var(--text-tertiary)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded border border-[var(--border-subtle)] shrink-0 h-8">
            <button
              onClick={() => setViewMode('grid')}
              className={`h-full px-2 rounded-sm transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-full px-2 rounded-sm transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <ListIcon className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {onImport && (
              <>
                <input type="file" ref={fileInputRef} accept=".json" onChange={onImport} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="h-8 px-2 flex items-center justify-center rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-sm" title="Importar JSON">
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            )}
            {onExport && (
              <button onClick={onExport} className="h-8 px-2 flex items-center justify-center rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-sm" title="Exportar JSON">
                <Download className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>

          <button
            onClick={onOpenModal}
            className="group flex items-center justify-center gap-2 bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] text-[var(--bg-elevated)] px-4 h-8 rounded text-[13px] font-medium transition-colors shrink-0 ml-1 shadow-sm"
          >
            {buttonIcon}
            <span>{buttonText}</span>
          </button>
        </div>
      </div>
      
      {/* MASS ACTION BAR */}
      <div className="w-full overflow-hidden relative" style={{ height: selectedIds && selectedIds.size > 0 && onDeleteSelected ? '36px' : '0px', transition: 'height 0.2s ease-in-out' }}>
        <AnimatePresence>
          {selectedIds && selectedIds.size > 0 && onDeleteSelected && (
            <motion.div 
              initial={{ y: -36, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -36, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-0 bg-[var(--accent-main)]/[0.05] border-t border-[var(--accent-main)]/[0.1] h-[36px] flex items-center"
            >
              <div className="w-full px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[var(--accent-main)] text-[var(--bg-elevated)] rounded-full flex items-center justify-center text-[10px] font-mono font-bold">
                    {selectedIds.size}
                  </span>
                  <span className="text-[12px] font-medium text-[var(--text-primary)]">
                    {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
                  </span>
                </div>
                <button 
                  onClick={onDeleteSelected}
                  className="px-3 py-1 rounded text-[11px] font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                >
                  Excluir Selecionados
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
