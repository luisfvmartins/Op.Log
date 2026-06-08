import { useState, useMemo, useRef } from 'react';
import { Search, LayoutGrid, List, Plus, MapPin, Copy, Share2, Edit2, Trash2, Route as RouteIcon, X, Map, Sun, Moon, LogOut, Download, Upload, Info } from 'lucide-react';
import { usePlaces } from '../hooks/usePlaces';
import { useToast } from '../hooks/useToast';
import { Place } from '../services/places';
import { PlaceForm } from '../components/features/places/PlaceForm';
import { RouteBuilder } from '../components/features/routes/RouteBuilder';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Drawer } from '../components/ui/Drawer';
import { ToastContainer } from '../components/ui/Toast';
import { formatRouteMessage } from '../lib/formatter';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { places, loading, add, update, remove, importData } = usePlaces();
  const { toasts, addToast, removeToast } = useToast();
  const { user, logout } = useAuth();
  
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modals state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>();
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (rest logic down before derived state)
  const handleExport = () => {
    const dataToExport = places.map(({ id, userId, createdAt, updatedAt, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'locais_exportados.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Dados exportados.', 'info');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        await importData(data);
        addToast(`${data.length} locais importados com sucesso.`, 'success');
      } else {
        throw new Error('Formato de arquivo inválido. Deve ser um array JSON de locais.');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Derived state
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return places;
    
    return places.filter(place => {
      return Object.entries(place).some(([key, value]) => {
        if (key === 'linkGoogleMaps' || key === 'id' || key === 'createdAt' || key === 'updatedAt') return false;
        if (typeof value === 'string') {
          return value.toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [places, searchQuery]);

  const selectedPlaces = useMemo(() => {
    return Array.from(selectedIds).map(id => places.find(p => p.id === id)!).filter(Boolean);
  }, [selectedIds, places]);

  // Handlers
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreateOrUpdate = async (data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsBusy(true);
    try {
      if (editingPlace?.id) {
        await update(editingPlace.id, data);
        addToast('Local atualizado com sucesso.', 'success');
      } else {
        await add(data);
        addToast('Local salvo com sucesso.', 'success');
      }
      setIsPlaceModalOpen(false);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlaceId) return;
    setIsBusy(true);
    try {
      await remove(deletingPlaceId);
      addToast('Local excluído.', 'success');
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deletingPlaceId);
        return next;
      });
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
      setDeletingPlaceId(null);
    }
  };

  const handleCopySingle = async (place: Place) => {
    const msg = formatRouteMessage([place], '[INFORMAR CARRETA]');
    await navigator.clipboard.writeText(msg);
    addToast('Programação copiada com sucesso.', 'success');
  };

  const handleShareSingle = async (place: Place) => {
    const msg = formatRouteMessage([place], '[INFORMAR CARRETA]');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded text-white">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">Locais e Roteiros</h1>
            <p className="text-xs text-slate-500 font-medium">{places.length} locais registrados</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80 group order-last flex-basis-full sm:order-none sm:flex-basis-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nome, cidade ou razão social..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1 shrink-0 mr-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                title="Visualização em Cards"
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                title="Visualização em Lista"
              >
                Lista
              </button>
            </div>

            <button
              onClick={handleExport}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title="Exportar dados"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleImport} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title="Importar dados"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title="Sobre o aplicativo"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button
              onClick={logout}
              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setEditingPlace(undefined);
                setIsPlaceModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ml-2"
            >
              <span className="hidden sm:inline">+ Novo Local</span>
              <Plus className="w-4 h-4 sm:hidden" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-6 max-w-[1600px] mx-auto pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
            <MapPin className="w-10 h-10 text-zinc-700 mb-4" />
            <h3 className="text-zinc-100 font-medium mb-1">Nenhum local encontrado</h3>
            <p className="text-zinc-500 text-sm">Tente buscar por outros termos ou cadastre um novo local.</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                isSelected={selectedIds.has(place.id!)}
                onSelect={() => toggleSelection(place.id!)}
                onEdit={() => { setEditingPlace(place); setIsPlaceModalOpen(true); }}
                onDelete={() => setDeletingPlaceId(place.id!)}
                onCopy={() => handleCopySingle(place)}
                onShare={() => handleShareSingle(place)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-[#09090B]/50 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Nome Fantasia</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Razão Social</th>
                  <th className="px-4 py-3 w-28 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredPlaces.map(place => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    isSelected={selectedIds.has(place.id!)}
                    onSelect={() => toggleSelection(place.id!)}
                    onEdit={() => { setEditingPlace(place); setIsPlaceModalOpen(true); }}
                    onDelete={() => setDeletingPlaceId(place.id!)}
                    onCopy={() => handleCopySingle(place)}
                    onShare={() => handleShareSingle(place)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* CONTEXTUAL ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-blue-600 px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl shadow-blue-600/40 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-6 border-r border-blue-400">
            <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium text-white hidden sm:inline">Selecionados</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRouteDrawerOpen(true)}
              className="text-sm font-bold text-white flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              Criar Roteiro
            </button>
            <button
              onClick={clearSelection}
              className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* MODALS AND DRAWERS */}
      <Modal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        title={editingPlace ? 'Editar Local' : 'Novo Local'}
      >
        <PlaceForm
          initialData={editingPlace}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsPlaceModalOpen(false)}
          isLoading={isBusy}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingPlaceId}
        onClose={() => setDeletingPlaceId(null)}
        onConfirm={handleDelete}
        title="Deseja excluir este local?"
        description="Esta ação não poderá ser desfeita. O local será removido permanentemente de todos os registros."
        isDestructive
        confirmText="Excluir Permanentemente"
      />

      <Drawer
        isOpen={isRouteDrawerOpen}
        onClose={() => setIsRouteDrawerOpen(false)}
        title="Montar Roteiro"
      >
        <RouteBuilder
          selectedPlaces={selectedPlaces}
          onClose={() => setIsRouteDrawerOpen(false)}
          onSuccess={(msg) => addToast(msg, 'success')}
          onClearSelection={clearSelection}
          onRemoveFromSelection={(id) => {
            const next = new Set(selectedIds);
            next.delete(id);
            setSelectedIds(next);
            if (next.size === 0) setIsRouteDrawerOpen(false);
          }}
        />
      </Drawer>

      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="Sobre"
      >
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
            O <strong>Locais e Roteiros</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente seus locais de parada e organizar seus roterios de viagens.
          </p>
          
          <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Criador</h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Desenvolvido por <strong>Luis Martins</strong>.
            </p>
            
            <div className="flex flex-col gap-2">
              <a 
                href="https://instagram.com/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                Instagram: @luisfvmartins
              </a>
              <a 
                href="https://linkedin.com/in/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                LinkedIn: @luisfvmartins
              </a>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------- Helper Components ----------------

function PlaceCard({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare }: any) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 group transition-all duration-200 ${isSelected ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/5 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.08] shadow-sm'}`}>
      
      {/* Checkbox */}
      <div 
        className="absolute top-3 right-3 z-10 cursor-pointer" 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600' : 'bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 group-hover:border-slate-400 dark:group-hover:border-white/40'}`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col cursor-pointer" onClick={onSelect}>
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate block pr-6">{place.nomeRazaoSocial}</span>
          <h3 className="text-slate-900 dark:text-white font-medium text-base truncate">{place.nomeFantasia}</h3>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            <span className="truncate">{place.cidade}</span>
          </div>
        </div>
        
        {place.observacao && (
          <div className="py-2 px-3 mt-3 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Observação</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{place.observacao}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-white/5">
        <button onClick={onCopy} className="text-xs text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1 group-hover:text-blue-500 dark:group-hover:text-blue-400">
          <Copy className="w-3 h-3" />
          Copiar Info
        </button>
        <div className="flex gap-2">
          <button onClick={onShare} className="p-1.5 text-slate-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="WhatsApp">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceRow({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare }: any) {
  return (
    <tr className={`group transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-500/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
      <td className="px-4 py-3">
        <div className="flex items-center cursor-pointer" onClick={onSelect}>
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-white/20 bg-white dark:bg-black/20'}`}>
            {isSelected && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
        <div className="flex items-center gap-2">
          {place.nomeFantasia}
          {place.observacao && (
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500" title={place.observacao} />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{place.cidade}</td>
      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{place.nomeRazaoSocial}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={onCopy} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded" title="Copiar">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onShare} className="p-1.5 text-slate-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded" title="WhatsApp">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
