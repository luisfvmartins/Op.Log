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
  buttonIcon = <Plus className="w-4 h-4 shrink-0" />,
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
    <div className="sticky top-0 z-30 flex flex-col items-center justify-center pt-8 pb-4 bg-[var(--bg-base)]">
      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col select-none">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-none">{title}</h1>
            {subtitle && <p className="text-xs font-mono text-[var(--text-tertiary)] mt-2 uppercase tracking-widest">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto pb-1 sm:pb-0 overflow-x-auto hide-scrollbar">
            <div className="relative group w-48 sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-primary)] transition-colors" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--text-primary)]/[0.03] dark:bg-[var(--text-primary)]/[0.03] border border-transparent hover:border-[var(--border)] focus:border-[var(--border-hover)] rounded-md pl-9 pr-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-4 focus:ring-[var(--border)] transition-all font-medium"
              />
            </div>

            <div className="relative border border-transparent hover:border-[var(--border)] bg-[var(--text-primary)]/[0.03] dark:bg-[var(--text-primary)]/[0.03] rounded-md flex-shrink-0 transition-all focus-within:ring-4 focus-within:ring-[var(--border)]">
               <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm text-[var(--text-primary)] font-medium cursor-pointer focus:outline-none"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-tertiary)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="flex items-center bg-[var(--text-primary)]/[0.03] p-0.5 rounded-md border border-[var(--border)] shrink-0 h-[34px]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-transparent'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'list' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-transparent'}`}
              >
                <ListIcon className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>

            <div className="flex items-center pl-1 shrink-0 gap-1">
              {onImport && (
                <>
                  <input type="file" ref={fileInputRef} accept=".json" onChange={onImport} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="h-[34px] w-[34px] flex items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Importar">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </>
              )}
              {onExport && (
                <button onClick={onExport} className="h-[34px] w-[34px] flex items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Exportar">
                  <Download className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}
            </div>

            <button
              onClick={onOpenModal}
              className="group flex items-center justify-center gap-1.5 bg-[var(--text-primary)] hover:bg-[var(--text-primary)]/90 text-[var(--bg-base)] px-4 h-[34px] rounded-md text-sm font-medium transition-all shrink-0 ml-1"
            >
              {buttonIcon}
              <span>{buttonText}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* MASS ACTION BAR */}
      <div className="w-full overflow-hidden relative" style={{ height: selectedIds && selectedIds.size > 0 && onDeleteSelected ? '40px' : '0px', transition: 'height 0.2s ease-in-out' }}>
        <AnimatePresence>
          {selectedIds && selectedIds.size > 0 && onDeleteSelected && (
            <motion.div 
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-0 bg-[var(--text-primary)] text-[var(--bg-base)] h-[40px] flex items-center"
            >
              <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-8 flex items-center justify-between">
                <span className="font-mono text-xs tracking-widest uppercase">
                  {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
                </span>
                <button 
                  onClick={onDeleteSelected}
                  className="bg-[var(--bg-base)]/10 hover:bg-[var(--bg-base)]/20 px-3 py-1 rounded text-xs font-semibold uppercase tracking-widest transition-colors"
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
