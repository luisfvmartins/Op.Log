import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, Plus, MapPin, Copy, Share2, Edit2, Trash2, Route as RouteIcon, X, Map, Sun, Moon, LogOut, Download, Upload, Info, Instagram, Linkedin, ExternalLink } from 'lucide-react';
import { usePlaces } from '../hooks/usePlaces';
import { useToast } from '../hooks/useToast';
import { Place } from '../services/places';
import { PlaceForm } from '../components/features/places/PlaceForm';
import { RouteBuilder } from '../components/features/routes/RouteBuilder';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Drawer } from '../components/ui/Drawer';
import { ToastContainer } from '../components/ui/Toast';
import { formatRouteMessage, ensureAbsoluteUrl } from '../lib/formatter';
import { useAuth } from '../contexts/AuthContext';
import { getCidadesBrasileiras } from '../services/ibge';

export function Dashboard({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const [cidadesReais, setCidadesReais] = useState<string[]>([]);
  
  useEffect(() => {
    getCidadesBrasileiras().then(setCidadesReais);
  }, []);

  const renderCity = (city?: string) => {
    if (!city) return '';
    if (city.includes('-')) return city.replace(' - ', '-');
    
    if (cidadesReais.length > 0) {
      const matches = cidadesReais.filter(c => c.split(' - ')[0].toLowerCase() === city.toLowerCase());
      if (matches.length === 1) {
        return matches[0].replace(' - ', '-');
      }
    }
    return city;
  };

  const { places, loading, add, update, remove, removeSelected, removeAll, importData } = usePlaces();
  const { toasts, addToast, removeToast } = useToast();
  const { user, logout } = useAuth();
  
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [sortBy, setSortBy] = useState<'alpha' | 'created' | 'updated'>('created');
  
  // Modals state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>();
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);
  const [deleteAllConfirmStep, setDeleteAllConfirmStep] = useState(0);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAllToggle = () => {
    if (selectedIds.size === filteredPlaces.length && filteredPlaces.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPlaces.map(p => p.id!)));
    }
  };

  const executeDeleteSelected = async () => {
    setIsBusy(true);
    try {
      if (selectedIds.size === places.length && removeAll) {
        await removeAll();
      } else {
        await removeSelected(Array.from(selectedIds));
      }
      addToast(`${selectedIds.size} locais foram apagados com sucesso.`, 'success');
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
      addToast('Erro ao apagar locais.', 'error');
    } finally {
      setIsBusy(false);
      setDeleteAllConfirmStep(0);
    }
  };

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
    let result = places;
    
    // Search
    if (searchQuery) {
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const qTerms = normalize(searchQuery).split(' ').filter(Boolean);
      result = result.filter(place => {
        const searchText = [
          place.nomeFantasia, 
          place.cidade, 
          place.endereco,
          place.nomeRazaoSocial, 
          place.observacao, 
          ...(place.observacoes?.map(o => `${o.categoria} ${o.texto}`) || []),
          ...(Array.isArray(place.tags) ? place.tags : [])
        ].filter(Boolean).map(normalize).join(' ');
        
        return qTerms.every(term => searchText.includes(term));
      });
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.nomeFantasia.localeCompare(b.nomeFantasia);
      } else if (sortBy === 'updated') {
        const dateA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
        const dateB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
        return dateB - dateA; // newest first
      } else {
        // created (default)
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }
    });
  }, [places, searchQuery, sortBy]);

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
    const msg = formatRouteMessage([place], '[INFORMAR PLACA]');
    await navigator.clipboard.writeText(msg);
    addToast('Programação copiada com sucesso.', 'success');
  };

  const handleShareSingle = async (place: Place) => {
    const msg = formatRouteMessage([place], '[INFORMAR PLACA]');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-600/20">
              <Map className="w-5 h-5" />
            </div>
            <div className="select-none">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Locais e Roteiros</h1>
              <p className="text-xs text-slate-500 font-medium">{places.length} {places.length === 1 ? 'local registrado' : 'locais registrados'}</p>
            </div>
          </div>
          
          <div className="flex xl:hidden gap-2">
             <button
                onClick={() => {
                  setEditingPlace(undefined);
                  setIsPlaceModalOpen(true);
                }}
                className="flex items-center justify-center w-10 h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg transition-colors"
                title="Novo Local"
              >
                <Plus className="w-5 h-5" />
              </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
          <div className="relative w-full sm:w-80 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nome, cidade ou razão social..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 max-w-full">
            <div className="flex overflow-x-auto sm:overflow-visible bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1 shrink-0 mr-2 max-w-full">
              <button
                onClick={handleSelectAllToggle}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors border-r border-slate-200 dark:border-white/10 mr-1 ${selectedIds.size === filteredPlaces.length && filteredPlaces.length > 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                title="Selecionar Tudo"
              >
                Todos
              </button>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'alpha' | 'created' | 'updated')}
                className="bg-transparent text-xs font-medium text-slate-500 dark:text-slate-400 focus:outline-none dark:bg-[#09090B] px-2 py-1 mr-2 border-r border-slate-200 dark:border-white/10"
              >
                <option value="created">Mais Recentes</option>
                <option value="updated">Editados</option>
                <option value="alpha">A-Z</option>
              </select>
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
              title="Importar locais de arquivo"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={handleExport}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title="Exportar locais para arquivo"
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-transparent dark:border-white/10 bg-slate-100 dark:bg-white/5 shrink-0"
              title="Sobre o aplicativo"
            >
              <Info className="w-4 h-4" />
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
              className="hidden xl:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Local</span>
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
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-2">Nenhum local encontrado</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">Tente buscar por outros termos, altere os filtros ou cadastre um novo local para começar.</p>
            <button
              onClick={() => {
                setEditingPlace(undefined);
                setIsPlaceModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Local
            </button>
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
                renderCity={renderCity}
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
                    renderCity={renderCity}
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
              onClick={() => setDeleteAllConfirmStep(1)}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
              title="Excluir selecionados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={clearSelection}
              className="text-sm font-medium text-blue-200 hover:text-white transition-colors ml-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* MODALS AND DRAWERS */}
      <ConfirmDialog
        isOpen={deleteAllConfirmStep === 1}
        onClose={() => setDeleteAllConfirmStep(0)}
        onConfirm={() => setDeleteAllConfirmStep(2)}
        title={selectedIds.size === places.length ? "Deseja realmente apagar TODOS os locais?" : `Deseja apagar os ${selectedIds.size} locais selecionados?`}
        description={selectedIds.size === places.length ? "Esta ação removerá todos os locais do seu banco de dados. Isso afetará todos os registros permanentemente." : "Os locais selecionados serão excluídos permanentemente."}
        isDestructive
        confirmText="Sim, continuar"
        cancelText="Cancelar"
      />

      <ConfirmDialog
        isOpen={deleteAllConfirmStep === 2}
        onClose={() => setDeleteAllConfirmStep(0)}
        onConfirm={executeDeleteSelected}
        title="ÚLTIMA CHANCE: Tem certeza absoluta?"
        description="Você está prestes a excluir estes locais permanentemente. Não será possível recuperar esses dados."
        isDestructive
        confirmText="EXCLUIR PERMANENTEMENTE"
        cancelText="Cancelar"
        requireInputConfirm={selectedIds.size === places.length ? "EXCLUIR TUDO" : "EXCLUIR"}
      />

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
        <div className="p-2 sm:p-4 text-slate-600 dark:text-slate-300">
          <p className="text-sm sm:text-base leading-relaxed mb-6">
            O <strong>Locais e Roteiros</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente seus locais de parada e organizar seus roteiros de viagens.
          </p>
          
          <div className="bg-slate-100 dark:bg-black/40 p-5 rounded-xl border border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Criador</h4>
            <p className="text-base text-slate-900 dark:text-white font-medium mb-4">
              Desenvolvido por Luis Martins
            </p>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://instagram.com/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">@luisfvmartins</span>
              </a>
              <a 
                href="https://linkedin.com/in/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">/in/luisfvmartins</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
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

function PlaceCard({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare, renderCity }: any) {
  return (
    <div className={`relative p-5 rounded-2xl border flex flex-col gap-3 group transition-all duration-300 cursor-pointer ${isSelected ? 'border-blue-500/70 bg-blue-50/50 dark:bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md'}`} onClick={onSelect}>
      
      {/* Checkbox */}
      <div className="absolute top-4 right-4 z-10 transition-transform group-hover:scale-105">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border border-blue-600 shadow-sm' : 'bg-white dark:bg-black/40 border-2 border-slate-300 dark:border-white/20 group-hover:border-slate-400 dark:group-hover:border-white/40'}`}>
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col border-b border-transparent">
        <div className="pr-8">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate block mb-1">{place.nomeRazaoSocial}</span>
          <div className="flex items-center gap-2">
            <h3 className="text-slate-900 dark:text-white font-semibold text-lg tracking-tight truncate">{place.nomeFantasia}</h3>
            {place.linkGoogleMaps && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
                }}
                className="text-slate-300 hover:text-blue-500 transition-colors" title="Abrir no Mapa"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-1 mt-2 mb-1">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{renderCity(place.cidade)}</span>
            </div>
            {place.endereco && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate pl-5">{place.endereco}</p>
            )}
          </div>
        </div>

        {Array.isArray(place.tags) && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {place.tags.map((tag: string) => (
               <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded-md border border-slate-200/50 dark:border-white/5 shadow-sm">{tag}</span>
            ))}
          </div>
        )}
        
        {place.observacoes && place.observacoes.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-4">
            {place.observacoes.map((obs: any, i: number) => (
              <div key={i} className="py-2 px-3 bg-amber-50/80 dark:bg-amber-500/10 rounded-lg border border-amber-200/60 dark:border-amber-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-none">
                <span className="text-[10px] text-amber-700/90 dark:text-amber-500 uppercase tracking-wide font-bold mr-1.5 block mb-0.5">{obs.categoria}</span>
                <span className="text-[11px] text-amber-900/90 dark:text-amber-200 line-clamp-2 leading-snug inline block sm:inline">{obs.texto}</span>
              </div>
            ))}
          </div>
        )}

        {place.observacao && (!place.observacoes || place.observacoes.length === 0) && (
          <div className="py-2 px-3 mt-4 bg-amber-50/80 dark:bg-amber-500/10 rounded-lg border border-amber-200/60 dark:border-amber-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-none">
            <span className="text-[10px] text-amber-700/90 dark:text-amber-500 uppercase tracking-wide font-bold mr-1.5 block mb-0.5">Observação</span>
            <span className="text-[11px] text-amber-900/90 dark:text-amber-200 line-clamp-2 leading-snug">{place.observacao}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5" onClick={e => e.stopPropagation()}>
        <button onClick={onCopy} className="text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group-hover:text-blue-500 dark:group-hover:text-blue-400 bg-slate-50 dark:bg-white/5 py-1.5 px-2.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10">
          <Copy className="w-3.5 h-3.5" />
          Copiar Info
        </button>
        <div className="flex gap-1.5">
          {place.linkGoogleMaps && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all" 
              title="Abrir no Mapa"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
          <button onClick={onShare} className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-md transition-all" title="WhatsApp">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-all" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceRow({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare, renderCity }: any) {
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
      <td className="px-4 py-3">
        <div className="flex flex-col py-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-white font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{place.nomeFantasia}</span>
            {place.linkGoogleMaps && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
                }}
                className="text-slate-300 hover:text-blue-500 transition-colors" title="Abrir no Mapa"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {place.observacoes && place.observacoes.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1">
              {place.observacoes.slice(0, 2).map((obs, i) => (
                <div key={i} className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate max-w-[250px]" title={`${obs.categoria}: ${obs.texto}`}>
                  <span className="font-bold mr-1">{obs.categoria}:</span>{obs.texto}
                </div>
              ))}
              {place.observacoes.length > 2 && (
                <span className="text-[9px] text-amber-600/70 dark:text-amber-500/70 italic">+{place.observacoes.length - 2} obs...</span>
              )}
            </div>
          )}

          {place.observacao && (!place.observacoes || place.observacoes.length === 0) && (
            <div className="text-[10px] mt-0.5 text-amber-700 dark:text-amber-400 font-medium truncate max-w-[250px]" title={place.observacao}>
              <span className="font-bold mr-1">Obs:</span>{place.observacao}
            </div>
          )}
          {Array.isArray(place.tags) && place.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {place.tags.map((tag: string) => (
                <span key={tag} className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#09090B] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[9px] font-medium rounded-md truncate max-w-[80px]">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">{renderCity(place.cidade)}</span>
          {place.endereco && <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px] mt-0.5">{place.endereco}</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{place.nomeRazaoSocial}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {place.linkGoogleMaps && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
              }}
              className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors" 
              title="Abrir no Mapa"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
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
