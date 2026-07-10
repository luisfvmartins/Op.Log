import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, Plus, MapPin, Copy, Share2, Edit2, Trash2, Route as RouteIcon, X, Map, Sun, Moon, LogOut, Download, Upload, Info, Instagram, Linkedin, ExternalLink, Check, Star, RotateCcw } from 'lucide-react';
import { usePlaces } from '../hooks/usePlaces';
import { useToast } from '../hooks/useToast';
import { Place } from '../services/places';
import { PlaceForm } from '../components/features/places/PlaceForm';
import { RouteBuilder } from '../components/features/routes/RouteBuilder';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ToastContainer } from '../components/ui/Toast';
import { formatRouteMessage, formatPlaceInfoText, ensureAbsoluteUrl } from '../lib/formatter';
import { useAuth } from '../contexts/AuthContext';
import { getCidadesBrasileiras } from '../services/ibge';
import { useViewPrefs } from '../hooks/useViewPrefs';
import { UnifiedHeader } from '../components/UnifiedHeader';

import { AboutModal } from '../components/ui/AboutModal';

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
  
  const { viewMode, setViewMode, sortBy, setSortBy } = useViewPrefs('dashboard', 'grid', 'created');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modals state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>();
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);
  const [deleteAllConfirmStep, setDeleteAllConfirmStep] = useState(0);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
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
      // Favoritos primeiro
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      if (sortBy === 'alpha') {
        return a.nomeFantasia.localeCompare(b.nomeFantasia);
      } else if (sortBy === 'alpha-za') {
        return b.nomeFantasia.localeCompare(a.nomeFantasia);
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
    const msg = formatPlaceInfoText(place);
    await navigator.clipboard.writeText(msg);
    addToast('Informações do local copiadas com sucesso.', 'success');
  };

  const handleShareSingle = async (place: Place) => {
    const msg = formatPlaceInfoText(place);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleResetAllCounters = async () => {
    if (confirm('Deseja zerar os contadores de uso em roteiros de todos os locais? Essa ação não pode ser desfeita.')) {
      setIsBusy(true);
      try {
        const resetPromises = places.filter(p => p.routeCount && p.routeCount > 0).map(p => update(p.id!, { routeCount: 0 }));
        await Promise.all(resetPromises);
        addToast('Contadores zerados com sucesso', 'success');
      } catch (err: any) {
        addToast(err.message || 'Erro ao zerar contadores', 'error');
      } finally {
        setIsBusy(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* HEADER */}
      <UnifiedHeader
        title="Locais e Roteiros"
        subtitle={`${places.length} locais registrados`}
        totalCount={places.length}
        filteredCount={filteredPlaces.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode as 'grid'|'list'}
        setViewMode={(m) => setViewMode(m as any)}
        sortBy={sortBy}
        setSortBy={(v) => setSortBy(v as any)}
        sortOptions={[
          {value: 'created', label: 'Mais Recentes'},
          {value: 'updated', label: 'Editados'},
          {value: 'alpha', label: 'Ordem alfabética (A-Z)'},
          {value: 'alpha-za', label: 'Ordem alfabética (Z-A)'}
        ]}
        onOpenModal={() => {
          setEditingPlace(undefined);
          setIsPlaceModalOpen(true);
        }}
        buttonText="Novo Local"
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setAboutModalOpen={setIsAboutModalOpen}
        onImport={handleImport}
        onExport={handleExport}
        selectedIds={selectedIds}
        toggleSelectAll={handleSelectAllToggle}
        onDeleteSelected={() => setDeleteAllConfirmStep(1)}
        searchPlaceholder="Pesquisar por nome, cidade ou razão social..."
        onResetCounters={handleResetAllCounters}
      />

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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 xl:bg-slate-900 xl:hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Local
            </button>
          </div>
        ) : viewMode === 'grid' ? (
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
                onToggleFavorite={async (e: any) => {
                  e.stopPropagation();
                  if (place.id) await update(place.id, { isFavorite: !place.isFavorite });
                }}
                onResetRouteCount={async (e: any) => {
                  e.stopPropagation();
                  if (place.id) await update(place.id, { routeCount: 0 });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-transparent border-b border-[var(--border)] text-[var(--text-tertiary)] font-mono tracking-widest text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={handleSelectAllToggle}
                      className="cursor-pointer flex items-center justify-center w-full h-full"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${selectedIds.size === filteredPlaces.length && filteredPlaces.length > 0 ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
                        {selectedIds.size === filteredPlaces.length && filteredPlaces.length > 0 && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  </th>
                  <th className="px-4 py-3">NOME FANTASIA</th>
                  <th className="px-4 py-3">CIDADE</th>
                  <th className="px-4 py-3">RAZÃO SOCIAL</th>
                  <th className="px-5 py-3 pr-6 w-32 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-none">
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
                    onToggleFavorite={async (e: any) => {
                      e.stopPropagation();
                      if (place.id) await update(place.id, { isFavorite: !place.isFavorite });
                    }}
                    onResetRouteCount={async (e: any) => {
                      e.stopPropagation();
                      if (place.id) await update(place.id, { routeCount: 0 });
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* CONTEXTUAL ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[var(--accent)] px-6 py-3 rounded-xl flex items-center gap-6 shadow-[0_4px_24px_rgba(212,168,67,0.3)] animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-6 border-r border-[#0C0D0F]/10">
            <span className="w-6 h-6 bg-[#0C0D0F]/10 text-[#0C0D0F] rounded-md flex items-center justify-center text-xs font-mono font-bold">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium text-[#0C0D0F] hidden sm:inline">Selecionados</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRouteModalOpen(true)}
              className="text-sm font-semibold text-[#0C0D0F] flex items-center gap-2 hover:bg-[#0C0D0F]/10 px-3 py-1.5 rounded-md transition-colors border border-transparent"
            >
              Criar Roteiro
            </button>
            <button
              onClick={() => setDeleteAllConfirmStep(1)}
              className="p-1.5 text-[#0C0D0F]/70 hover:text-[#0C0D0F] hover:bg-[#0C0D0F]/10 rounded-md transition-colors ml-2"
              title="Excluir selecionados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={clearSelection}
              className="text-sm font-medium text-[#0C0D0F]/70 hover:text-[#0C0D0F] transition-colors ml-2"
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

      <Modal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        title="Montar Roteiro"
      >
        <RouteBuilder
          selectedPlaces={selectedPlaces}
          onClose={() => setIsRouteModalOpen(false)}
          onSuccess={(msg) => addToast(msg, 'success')}
          onClearSelection={clearSelection}
          onRemoveFromSelection={(id) => {
            const next = new Set(selectedIds);
            next.delete(id);
            setSelectedIds(next);
            if (next.size === 0) setIsRouteModalOpen(false);
          }}
        />
      </Modal>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
}


// ---------------- Helper Components ----------------

function PlaceCard({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare, renderCity, onToggleFavorite, onResetRouteCount }: any) {
  return (
    <div className={`relative p-5 rounded-xl flex flex-col gap-3 min-h-[220px] group transition-all duration-150 cursor-pointer border ${isSelected ? 'border-[var(--accent-border)] bg-[var(--accent-tint)]' : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'}`} onClick={onSelect}>
      
      {/* Top right actions (Favorite, Checkbox) */}
      <div className={`absolute top-4 right-4 z-10 flex flex-col items-center gap-2 transition-opacity ${isSelected || place.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button 
          onClick={onToggleFavorite}
          className={`p-1.5 rounded-full transition-colors ${place.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-[var(--text-tertiary)] hover:text-yellow-400'}`}
          title={place.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Star className={`w-4 h-4 ${place.isFavorite ? 'fill-current' : ''}`} />
        </button>
        <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors border ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'bg-[var(--bg-surface)] border-[var(--border)]'}`}>
          {isSelected && (
            <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="pr-8 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] truncate block mb-1">{place.nomeRazaoSocial}</span>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight truncate">{place.nomeFantasia}</h3>
            {place.linkGoogleMaps && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
                }}
                className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors shrink-0" title="Abrir no Mapa"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-1 mt-1 mb-1">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{renderCity(place.cidade)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-3 mt-2 pb-2 
          [&::-webkit-scrollbar]:w-1 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-[var(--border)]
          [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {Array.isArray(place.tags) && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {place.tags.map((tag: string) => (
                 <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-base)] text-[var(--text-tertiary)] text-[10px] font-mono rounded border border-[var(--border)] shadow-sm">{tag}</span>
              ))}
            </div>
          )}
          
          {place.observacoes && place.observacoes.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {place.observacoes.map((obs: any, i: number) => (
                <div key={i} className="border-l-2 border-[var(--accent)] pl-2 shrink-0">
                  <span className="text-[10px] text-[var(--accent)] uppercase tracking-widest font-mono block mb-0.5">{obs.categoria}</span>
                  <span className="text-xs text-[var(--text-secondary)] leading-snug inline-block">{obs.texto}</span>
                </div>
              ))}
            </div>
          )}

          {place.observacao && (!place.observacoes || place.observacoes.length === 0) && (
            <div className="mt-3 border-l-2 border-[var(--accent)] pl-2 shrink-0">
              <span className="text-[10px] text-[var(--accent)] uppercase tracking-widest font-mono block mb-0.5">Observação</span>
              <span className="text-xs text-[var(--text-secondary)] leading-snug">{place.observacao}</span>
            </div>
          )}

          {place.routeCount !== undefined && place.routeCount > 0 && (
            <div className="flex items-center gap-1 mt-4 text-xs text-[var(--text-secondary)]">
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Usado em <strong>{place.routeCount}</strong> {place.routeCount === 1 ? 'roteiro' : 'roteiros'}</span>
              <button 
                onClick={onResetRouteCount} 
                className="ml-auto p-1.5 text-[var(--text-tertiary)] hover:text-[#E05252] rounded transition-colors hover:bg-[var(--bg-base)]"
                title="Resetar contador"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)] shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onCopy} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline transition-colors flex items-center gap-1.5 py-1.5">
          <Copy className="w-3.5 h-3.5" />
          Copiar Info
        </button>
        <div className="flex gap-1.5 text-[var(--text-tertiary)]">
          {place.linkGoogleMaps && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
              }}
              className="p-1.5 hover:text-[var(--accent)] rounded-md transition-colors" 
              title="Abrir no Mapa"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onShare} className="p-1.5 hover:text-[#4CAF7D] rounded-md transition-colors" title="WhatsApp">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} className="p-1.5 hover:text-[var(--text-primary)] rounded-md transition-colors" title="Editar">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:text-[#E05252] rounded-md transition-colors" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceRow({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare, renderCity, onToggleFavorite, onResetRouteCount }: any) {
  return (
    <tr className={`group transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-500/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center cursor-pointer" onClick={onSelect}>
            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-white/20 bg-white dark:bg-black/20'}`}>
              {isSelected && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </div>
          </div>
          <button 
            onClick={onToggleFavorite}
            className={`p-1 rounded-full transition-colors ${place.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-slate-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100'}`}
            title={place.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star className={`w-3.5 h-3.5 ${place.isFavorite ? 'fill-current' : ''}`} />
          </button>
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
        </div>
      </td>
      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{place.nomeRazaoSocial}</td>
      <td className="px-5 py-3 pr-6 text-right">
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
