import { Upload, Download, Sun, Moon, Info, LogOut, LayoutGrid, List as ListIcon, Search, Plus, X } from 'lucide-react';
import { useRef } from 'react';

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
  buttonIcon = <Plus className="w-5 h-5 shrink-0" />,
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
    <header className="sticky top-0 z-30 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border)] flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 py-3 max-w-screen-2xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col select-none">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">{title}</h1>
            {subtitle && <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
            <div className="relative group w-40 sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md pl-9 pr-9 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-0 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-base)]"
                  title="Limpar pesquisa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative border border-[var(--border)] bg-[var(--bg-surface)] rounded-md flex-shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm text-[var(--text-primary)] cursor-pointer focus:outline-none"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-tertiary)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="flex items-center border-l border-[var(--border)] pl-3 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
              >
                <ListIcon className="w-4 h-4 shrink-0" />
              </button>
              
              {onImport && (
                <>
                  <input type="file" ref={fileInputRef} accept=".json" onChange={onImport} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-1.5 ml-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Importar">
                    <Upload className="w-4 h-4 shrink-0" />
                  </button>
                </>
              )}
              {onExport && (
                <button onClick={onExport} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Exportar">
                  <Download className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>

            <button
              onClick={onOpenModal}
              className="flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#0C0D0F] px-4 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0"
            >
              <span>{buttonText}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* MASS ACTION BAR */}
      {selectedIds && selectedIds.size > 0 && onDeleteSelected && (
        <div className="bg-[var(--accent)] px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between shadow-inner animate-in slide-in-from-top-2 text-[#0C0D0F]">
          <span className="font-mono text-sm tracking-wide">
             {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
          </span>
          <button 
             onClick={onDeleteSelected}
             className="bg-black/5 hover:bg-black/10 px-4 py-1.5 rounded-md font-semibold text-sm transition-colors"
          >
             Excluir Selecionados
          </button>
        </div>
      )}
    </header>
  );
}
