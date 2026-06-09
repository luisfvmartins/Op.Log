import { useState, useEffect } from 'react';
import { Place, Observacao } from '../../../services/places';
import { capitalizeText } from '../../../lib/formatter';
import { getCidadesBrasileiras } from '../../../services/ibge';
import { Plus, Trash2, Settings, X, GripVertical } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategories, saveCategories, Category } from '../../../services/categories';
import { AutocompleteInput } from '../../ui/AutocompleteInput';
import { Modal } from '../../ui/Modal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface PlaceFormProps {
  initialData?: Place;
  onSubmit: (data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlaceForm({ initialData, onSubmit, onCancel, isLoading }: PlaceFormProps) {
  const { user } = useAuth();
  const [cidadesReais, setCidadesReais] = useState<string[]>([]);
  const [cidadeError, setCidadeError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nomeFantasia: '',
    cidade: '',
    endereco: '',
    nomeRazaoSocial: '',
    linkGoogleMaps: '',
  });
  const [observacoes, setObservacoes] = useState<(Observacao & { clientId: string })[]>([]);

  useEffect(() => {
    getCidadesBrasileiras().then(setCidadesReais);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      getCategories(user.uid).then(setCategories);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomeFantasia: initialData.nomeFantasia || '',
        cidade: initialData.cidade || '',
        endereco: initialData.endereco || '',
        nomeRazaoSocial: initialData.nomeRazaoSocial || '',
        linkGoogleMaps: initialData.linkGoogleMaps || '',
      });
      if (initialData.observacoes && initialData.observacoes.length > 0) {
        setObservacoes(initialData.observacoes.map(o => ({ ...o, clientId: crypto.randomUUID() })));
      } else {
        const oldObs: (Observacao & { clientId: string })[] = [];
        if (initialData.observacao) {
          oldObs.push({ categoria: 'Geral', texto: initialData.observacao, clientId: crypto.randomUUID() });
        }
        if (initialData.tags && Array.isArray(initialData.tags)) {
          oldObs.push({ categoria: 'Tags', texto: initialData.tags.join(', '), clientId: crypto.randomUUID() });
        }
        setObservacoes(oldObs);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'cidade') {
      formattedValue = value;
      setCidadeError('');
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.currentTarget.name;
    if (name !== 'linkGoogleMaps' && name !== 'cidade') {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const formattedText = capitalizeText(pastedText);
      
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value;
      
      const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
      
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const handleObsChange = (index: number, field: keyof Observacao, value: string) => {
    const newObs = [...observacoes];
    newObs[index][field] = value;
    setObservacoes(newObs);
  };

  const addObservacao = () => {
    setObservacoes([...observacoes, { categoria: '', texto: '', clientId: crypto.randomUUID() }]);
  };

  const removeObservacao = (index: number) => {
    const newObs = [...observacoes];
    newObs.splice(index, 1);
    setObservacoes(newObs);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(observacoes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setObservacoes(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitData = { ...formData };
    
    if (cidadesReais.length > 0) {
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const typed = normalize(formData.cidade.trim());
      let matchedCity = cidadesReais.find(c => normalize(c) === typed);
      
      if (!matchedCity) {
        const exactNameMatches = cidadesReais.filter(c => normalize(c.split(' - ')[0]) === typed);
        if (exactNameMatches.length === 1) {
          matchedCity = exactNameMatches[0];
        } else if (exactNameMatches.length > 1) {
          setCidadeError('Há mais de uma cidade com este nome. Por favor, selecione (Cidade - UF) na lista.');
          return;
        }
      }

      if (!matchedCity) {
        setCidadeError('Por favor, selecione uma cidade válida da lista (Cidade - UF).');
        return;
      }
      
      submitData.cidade = matchedCity;
    }
    
    // Filter empty observations and remove clientId
    const cleanObs = observacoes
      .filter(o => o.categoria.trim() || o.texto.trim())
      .map(({ clientId, ...rest }) => rest);
    
    await onSubmit({
      ...submitData,
      observacoes: cleanObs
    });
  };

  // Category Manager logic
  const handleSaveCategories = async (newCats: Category[]) => {
    setCategories(newCats);
    if (user?.uid) {
      await saveCategories(user.uid, newCats);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nome Fantasia *</label>
          <input
            autoFocus
            required
            name="nomeFantasia"
            value={formData.nomeFantasia}
            onChange={handleChange}
            onPaste={handlePaste}
            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all z-0"
            placeholder="Ex: CD Magalu"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cidade *</label>
          <AutocompleteInput
            required
            value={formData.cidade}
            options={cidadesReais}
            onChange={(val) => {
              setFormData(p => ({ ...p, cidade: val }));
              setCidadeError('');
            }}
            placeholder="Ex: São Paulo - SP"
            className={`w-full bg-white dark:bg-black/40 border ${cidadeError ? 'border-red-500' : 'border-slate-300 dark:border-white/10'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
          />
          {cidadeError && <p className="text-xs text-red-500 font-medium mt-1">{cidadeError}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Endereço (Rua, Bairro, etc.)</label>
          <input
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            onPaste={handlePaste}
            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Razão Social / Nome completo *</label>
          <input
            required
            name="nomeRazaoSocial"
            value={formData.nomeRazaoSocial}
            onChange={handleChange}
            onPaste={handlePaste}
            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Magazine Luiza S/A"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Link Google Maps *</label>
          <input
            required
            type="url"
            name="linkGoogleMaps"
            value={formData.linkGoogleMaps}
            onChange={handleChange}
            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
              Observações Classificadas
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Configurar categorias"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </label>
            <button
              type="button"
              onClick={addObservacao}
              className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded"
            >
              <Plus className="w-3 h-3" />
              Adicionar Obs.
            </button>
          </div>
          
          {observacoes.length === 0 && (
            <div className="text-xs text-slate-400 dark:text-slate-500 italic p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
              Nenhuma observação cadastrada (opcional)
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="observacoes-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {observacoes.map((obs, index) => (
                    <Draggable key={obs.clientId} draggableId={obs.clientId} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex gap-2 items-start border p-2 rounded-lg ${snapshot.isDragging ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-md' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5'}`}
                        >
                          <div 
                            {...provided.dragHandleProps} 
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-2 cursor-grab active:cursor-grabbing"
                            title="Arrastar para reordenar"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <AutocompleteInput
                              value={obs.categoria}
                              options={categories.map(c => c.name)}
                              onChange={(val) => handleObsChange(index, 'categoria', val)}
                              placeholder="Categoria (ex: Insumos, EPI, Bairro)"
                              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            
                            <textarea
                              value={obs.texto}
                              onChange={(e) => handleObsChange(index, 'texto', e.target.value)}
                              rows={1}
                              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 resize-none h-auto min-h-[36px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Descrição (ex: Requer 2 catracas)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeObservacao(index)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded mt-0.5"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Salvar Local'}
          </button>
        </div>
      </form>

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSave={handleSaveCategories}
      />
    </>
  );
}

function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (cats: Category[]) => void;
}) {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalCategories(JSON.parse(JSON.stringify(categories)));
      setNewCatName('');
    }
  }, [isOpen, categories]);

  const handleAdd = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (localCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    
    setLocalCategories([
      ...localCategories,
      { id: crypto.randomUUID(), name: trimmed }
    ]);
    setNewCatName('');
  };

  const handleRemove = (id: string) => {
    setLocalCategories(localCategories.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Categorias">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Adicione ou remova as categorias de observações disponíveis.
        </p>

        <div className="flex gap-2">
          <input
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Nova categoria..."
            className="flex-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newCatName.trim()}
            className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {localCategories.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-4">Nenhuma categoria configurada.</p>
          )}
          {localCategories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg text-sm text-slate-700 dark:text-slate-200">
              <span>{cat.name}</span>
              <button
                onClick={() => handleRemove(cat.id)}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}

