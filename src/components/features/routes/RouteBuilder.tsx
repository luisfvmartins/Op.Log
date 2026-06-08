import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Send, Copy } from 'lucide-react';
import { Place } from '../../../services/places';
import { formatRouteMessage } from '../../../lib/formatter';
import { createRoute } from '../../../services/routes';

interface RouteBuilderProps {
  selectedPlaces: Place[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onClearSelection: () => void;
  onRemoveFromSelection: (id: string) => void;
}

export function RouteBuilder({ selectedPlaces, onClose, onSuccess, onClearSelection, onRemoveFromSelection }: RouteBuilderProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [carreta, setCarreta] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPlaces(selectedPlaces);
  }, [selectedPlaces]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(places);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPlaces(items);
  };

  const handleCopy = async () => {
    const message = formatRouteMessage(places, carreta, observacaoGeral);
    await navigator.clipboard.writeText(message);
    onSuccess('Programação copiada com sucesso.');
    saveRouteLog(message);
  };

  const handleShare = async () => {
    const message = formatRouteMessage(places, carreta, observacaoGeral);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    onSuccess('Redirecionado para o WhatsApp.');
    saveRouteLog(message);
  };

  const saveRouteLog = async (message: string) => {
    try {
      setIsSaving(true);
      await createRoute({
        carreta,
        observacaoGeral,
        destinos: places,
        mensagemGerada: message
      });
      onClearSelection();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar roteiro:', err);
      // Nao vamos travar a UX se der erro de log
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = carreta.trim().length > 0 && places.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Carreta *</label>
          <input
            required
            autoFocus
            value={carreta}
            onChange={(e) => setCarreta(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-center"
            placeholder="Ex: ABC-1234"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Observação Geral</label>
          <textarea
            value={observacaoGeral}
            onChange={(e) => setObservacaoGeral(e.target.value)}
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[80px]"
            placeholder="Instruções adicionais para o motorista..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 border-t border-white/10 pt-4">
        <h3 className="block text-[10px] font-bold text-slate-500 uppercase">Sequência de Destinos ({places.length})</h3>
        <span className="text-[10px] text-slate-500 font-medium">Arraste para reordenar</span>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {places.length === 0 ? (
          <div className="border-2 border-dashed border-white/5 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-600 uppercase font-bold">Nenhum local selecionado</span>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="route-places">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pb-20">
                  {places.map((place, index) => (
                    <Draggable key={place.id} draggableId={place.id!} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-start gap-3 bg-white/5 border rounded-lg pl-2 pr-3 py-3 relative group transition-colors ${
                            snapshot.isDragging ? 'border-blue-500/50 shadow-2xl shadow-blue-500/10' : 'border-white/10'
                          }`}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="mt-1 text-slate-500 hover:text-slate-300 transition-colors cursor-grab active:cursor-grabbing p-1"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-white flex items-center gap-2">
                              <span className="bg-slate-800 w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold shrink-0">
                                {index + 1}
                              </span>
                              <span className="truncate">{place.nomeFantasia}</span>
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate mt-1 ml-8">{place.cidade}</p>
                          </div>

                          <button
                            onClick={() => onRemoveFromSelection(place.id!)}
                            className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                            title="Remover do roteiro"
                          >
                            <Trash2 className="w-4 h-4" />
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
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/5 border-t border-white/10 flex gap-2 z-10 backdrop-blur-md">
        <button
          onClick={handleShare}
          disabled={!isFormValid || isSaving}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.1-.47-.15-.667.15-.198.3-.765.971-.937 1.171-.173.2-.345.225-.646.075-.3-.15-1.27-.468-2.42-1.494-.894-.798-1.498-1.783-1.674-2.083-.176-.3-.019-.462.13-.611.135-.135.3-.35.45-.525.151-.175.202-.3.303-.5.101-.2.05-.375-.025-.525-.075-.15-.667-1.611-.914-2.206-.241-.58-.487-.5-.667-.51-.173-.009-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.767-.721 2.016-1.418.25-.697.25-1.295.175-1.418-.076-.123-.277-.198-.578-.348z"/></svg>
          WhatsApp
        </button>
        <button
          onClick={handleCopy}
          disabled={!isFormValid || isSaving}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Copiar
        </button>
      </div>
    </div>
  );
}
