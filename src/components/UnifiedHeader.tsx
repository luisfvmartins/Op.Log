import { Upload, Download, Sun, Moon, Info, LogOut, LayoutGrid, List as ListIcon, Search, Plus } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex flex-col">
      <div className="px-6 sm:px-8 py-4 flex flex-col gap-4">
        {/* PRIMEIRA LINHA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="select-none">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h1>
          <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {onImport && (
            <>
              <input type="file" ref={fileInputRef} accept=".json" onChange={onImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
                <Upload className="w-4 h-4 shrink-0" /> Importar
              </button>
            </>
          )}
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <Download className="w-4 h-4 shrink-0" /> Exportar
            </button>
          )}
          {toggleTheme && (
            <button onClick={toggleTheme} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />} Tema
            </button>
          )}
          {setAboutModalOpen && (
            <button onClick={() => setAboutModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <Info className="w-4 h-4 shrink-0" /> Sobre
            </button>
          )}
          {logout && (
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <LogOut className="w-4 h-4 shrink-0" /> Sair
            </button>
          )}
        </div>
      </div>

      {/* SEGUNDA LINHA */}
      <div className="flex items-center justify-end">
        <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1">
          {toggleSelectAll && selectedIds && (
            <button
              onClick={toggleSelectAll}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border-r border-slate-200 dark:border-white/10 mr-1 ${(selectedIds.size === filteredCount && filteredCount > 0) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Todos
            </button>
          )}
          <div className="relative border-r border-slate-200 dark:border-white/10 mr-1">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer focus:outline-none dark:bg-[#09090B]"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" /> Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <ListIcon className="w-4 h-4 shrink-0" /> Lista
          </button>
        </div>
      </div>

      {/* TERCEIRA LINHA */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
        >
          {buttonIcon}
          <span className="hidden sm:inline">{buttonText}</span>
        </button>
      </div>
      </div>
      {/* MASS ACTION BAR */}
      {selectedIds && selectedIds.size > 0 && onDeleteSelected && (
        <div className="bg-blue-600 px-6 sm:px-8 py-3 flex items-center justify-between shadow-inner animate-in slide-in-from-top-2">
          <span className="text-white font-bold tracking-wide">
             {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
          </span>
          <button 
             onClick={onDeleteSelected}
             className="bg-white text-blue-600 hover:bg-slate-50 px-5 py-2 rounded-lg font-bold text-sm transition shadow shadow-blue-900/20"
          >
             Excluir Selecionados
          </button>
        </div>
      )}
    </header>
  );
}
