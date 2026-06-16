import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, Plus, MapPin, Copy, Share2, Edit2, Trash2, Route as RouteIcon, X, Map, Sun, Moon, LogOut, Download, Upload, Info, Instagram, Linkedin, ExternalLink, Check, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  return (
    <div className="flex flex-col flex-1 min-h-full font-sans">
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
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--text-tertiary)]">
            <div className="w-5 h-5 border-2 border-[var(--text-tertiary)] border-t-[var(--text-primary)] rounded-full animate-spin" />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 px-4 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-surface)] backdrop-blur-sm"
          >
            <div className="w-12 h-12 bg-[var(--text-primary)]/5 rounded-full flex items-center justify-center mb-5">
              <MapPin className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[var(--text-primary)] font-semibold mb-2 tracking-tight">Nenhum local encontrado</h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto mb-8">Tente buscar por outros termos, altere os filtros ou cadastre um novo local para começar.</p>
            <button
              onClick={() => {
                setEditingPlace(undefined);
                setIsPlaceModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-[var(--text-primary)] text-[var(--bg-base)] hover:bg-[var(--text-primary)]/90 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-transparent shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Local
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredPlaces.map(place => (
              <motion.div key={place.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <PlaceCard
                  place={place}
                  isSelected={selectedIds.has(place.id!)}
                  onSelect={() => toggleSelection(place.id!)}
                  onEdit={() => { setEditingPlace(place); setIsPlaceModalOpen(true); }}
                  onDelete={() => setDeletingPlaceId(place.id!)}
                  onCopy={() => handleCopySingle(place)}
                  onShare={() => handleShareSingle(place)}
                  renderCity={renderCity}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-tertiary)] font-mono tracking-widest text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={handleSelectAllToggle}
                      className="cursor-pointer flex items-center justify-center w-full h-full"
                      title="Selecionar Todos"
                    >
                      <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors border ${selectedIds.size === filteredPlaces.length && filteredPlaces.length > 0 ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-base)]' : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-tertiary)]'}`}>
                        {selectedIds.size === filteredPlaces.length && filteredPlaces.length > 0 && <Check className="w-3 h-3" strokeWidth={2.5} />}
                      </div>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Nome Fantasia</th>
                  <th className="px-4 py-3 font-medium">Cidade</th>
                  <th className="px-4 py-3 font-medium">Razão Social</th>
                  <th className="px-5 py-3 pr-6 w-32 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
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
          </motion.div>
        )}
      </main>

      {/* CONTEXTUAL ACTION BAR */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-40 bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-4 py-2 rounded-lg flex items-center gap-4 shadow-high"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-[var(--border-subtle)]">
              <span className="w-5 h-5 bg-[var(--accent-main)] text-[var(--bg-elevated)] rounded flex items-center justify-center text-xs font-mono font-bold">
                {selectedIds.size}
              </span>
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                {selectedIds.size === 1 ? 'Local selecionado' : 'Locais selecionados'}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={() => setIsRouteModalOpen(true)}
                className="text-[13px] font-medium text-[var(--bg-elevated)] bg-[var(--accent-main)] hover:bg-[var(--accent-hover)] px-3 py-1.5 rounded transition-colors"
              >
                Criar Roteiro
              </button>
              <button
                onClick={() => setDeleteAllConfirmStep(1)}
                className="text-[13px] font-medium text-red-600 hover:bg-red-500/10 px-3 py-1.5 rounded transition-colors"
              >
                Excluir
              </button>
              <button
                onClick={clearSelection}
                className="w-7 h-7 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors ml-1"
                title="Limpar seleção"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

function PlaceCard({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare, renderCity }: any) {
  return (
    <div 
      className={`relative p-5 rounded-xl flex flex-col h-[220px] group transition-all duration-200 cursor-pointer border ${isSelected ? 'border-[var(--border-strong)] bg-[var(--accent-main)]/[0.02] ring-1 ring-[var(--border-strong)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:shadow-low'}`} 
      onClick={onSelect}
    >
      {/* Checkbox */}
      <div className={`absolute top-5 right-5 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-colors border ${isSelected ? 'bg-[var(--accent-main)] border-[var(--accent-main)] text-[var(--bg-elevated)]' : 'bg-[var(--bg-surface)] border-[var(--border-strong)] group-hover:border-[var(--text-tertiary)]'}`}>
          {isSelected && (
            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="pr-8 shrink-0 mb-3 block">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--text-tertiary)] truncate mb-1">
            {place.nomeRazaoSocial || 'Sem Razão Social'}
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-tight truncate leading-tight">
              {place.nomeFantasia}
            </h3>
            {place.linkGoogleMaps && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
                }}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0" 
                title="Abrir no Mapa"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[12px] mt-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--text-tertiary)]" />
            <span className="truncate">{renderCity(place.cidade)}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-2 
          [&::-webkit-scrollbar]:w-1 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-[var(--border-strong)]
          [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {Array.isArray(place.tags) && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {place.tags.map((tag: string) => (
                 <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-[11px] font-medium rounded truncate max-w-full">
                   {tag}
                 </span>
              ))}
            </div>
          )}
          
          {place.observacoes && place.observacoes.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              {place.observacoes.map((obs: any, i: number) => (
                <div key={i} className="flex gap-2 text-[12px] leading-tight">
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider shrink-0 mt-0.5">{obs.categoria}</span>
                  <span className="text-[var(--text-secondary)]">{obs.texto}</span>
                </div>
              ))}
            </div>
          )}

          {place.observacao && (!place.observacoes || place.observacoes.length === 0) && (
            <div className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {place.observacao}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-subtle)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1 text-[var(--text-tertiary)] text-[12px] font-medium">
          <button onClick={onCopy} className="flex items-center gap-1.5 px-2 py-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors">
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar</span>
          </button>
           <button onClick={onShare} className="flex items-center gap-1.5 px-2 py-1.5 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
        <div className="flex gap-1 text-[var(--text-tertiary)]">
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors" title="Editar">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceRow({ place, isSelected, onSelect, onEdit, onDelete, onCopy, onShare, renderCity }: any) {
  return (
    <tr className={`group transition-colors border-b border-[var(--border-subtle)] last:border-0 ${isSelected ? 'bg-[var(--accent-main)]/[0.02]' : 'hover:bg-[var(--bg-subtle)]'}`}>
      <td className="px-4 py-3 align-middle w-10">
        <div className="flex items-center cursor-pointer h-full" onClick={onSelect}>
          <div className={`w-[16px] h-[16px] rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-[var(--accent-main)] border-[var(--accent-main)] text-[var(--bg-elevated)]' : 'border-[var(--border-strong)] bg-[var(--bg-surface)] group-hover:border-[var(--text-tertiary)]'}`}>
            {isSelected && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <span className="text-[var(--text-primary)] text-[13px] font-semibold tracking-tight truncate max-w-[200px]">{place.nomeFantasia}</span>
          {place.linkGoogleMaps && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(ensureAbsoluteUrl(place.linkGoogleMaps), '_blank', 'noopener,noreferrer');
              }}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100" title="Abrir no Mapa"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-[var(--text-secondary)] text-[13px] truncate max-w-[150px]">
        {renderCity(place.cidade)}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col gap-1 max-w-[300px]">
          <span className="text-[var(--text-tertiary)] text-[12px] truncate">
            {place.nomeRazaoSocial || '-'}
          </span>
          {Array.isArray(place.tags) && place.tags.length > 0 && (
             <div className="flex gap-1 flex-wrap">
               {place.tags.slice(0,2).map((tag: string) => (
                 <span key={tag} className="px-1.5 py-[1px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] font-medium rounded truncate max-w-[80px]">
                   {tag}
                 </span>
               ))}
               {place.tags.length > 2 && (
                 <span className="px-1 py-[1px] text-[var(--text-tertiary)] text-[10px]">+{place.tags.length - 2}</span>
               )}
             </div>
          )}
        </div>
      </td>
      <td className="px-5 py-3 pr-6 text-right align-middle">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onCopy} className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded transition-colors" title="Copiar">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onShare} className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#25D366] hover:bg-[var(--bg-surface)] rounded transition-colors" title="WhatsApp">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[var(--border-subtle)] mx-1"></div>
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
