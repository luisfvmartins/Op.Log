import { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Trash2, Send, Copy, Clock, Truck, MapPin } from 'lucide-react';
import { Place } from '../../../services/places';
import { RouteStop } from '../../../services/routes';
import { formatRouteMessage, capitalizeText } from '../../../lib/formatter';
import { createRoute } from '../../../services/routes';
import { useAuth } from '../../../contexts/AuthContext';
import { getCidadesBrasileiras } from '../../../services/ibge';

interface RouteBuilderProps {
  selectedPlaces: Place[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onClearSelection: () => void;
  onRemoveFromSelection: (id: string) => void;
}

function DraggableRouteStop({
  place,
  index,
  renderCity,
  onStopChange,
  onRemove,
}: {
  place: RouteStop;
  index: number;
  renderCity: (city?: string) => string;
  onStopChange: (id: string, field: keyof RouteStop, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={place}
      id={place.id!}
      dragListener={false}
      dragControls={controls}
      className="flex flex-col sm:flex-row items-start gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-xl pl-2 pr-3 py-3 relative group transition-all"
    >
      <div 
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        style={{ touchAction: 'none' }}
        className="mt-1 hidden sm:flex text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-grab active:cursor-grabbing p-1.5"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      {/* Mobile handle */}
      <div 
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        style={{ touchAction: 'none' }}
        className="flex sm:hidden items-center justify-center w-full mb-2 pb-2 border-b border-slate-100 dark:border-white/5 text-slate-400 cursor-grab active:cursor-grabbing"
      >
         <GripVertical className="w-5 h-5 rotate-90" />
      </div>
      
      <div className="flex-1 min-w-0 pr-6 w-full">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 min-w-[24px] h-6 px-1 flex items-center justify-center rounded text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <span className="truncate">{place.nomeFantasia}</span>
        </h4>
        <div className="ml-0 sm:ml-[10px] space-y-0.5">
          <p className="text-xs text-slate-500 truncate flex items-center gap-1 font-medium"><MapPin className="w-3 h-3 text-slate-400 shrink-0"/> {renderCity(place.cidade)}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-[10px] mt-3" onPointerDown={(e) => e.stopPropagation()}>
          <select
            value={place.operacao || ''}
            onChange={(e) => onStopChange(place.id!, 'operacao', e.target.value)}
            className="w-full sm:w-1/2 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-md px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">Sem op. específica</option>
            <option value="Entrega">Entrega</option>
            <option value="Coleta">Coleta</option>
            <option value="Transferência">Transferência</option>
            <option value="Devolução">Devolução</option>
            <option value="Manutenção">Manutenção</option>
          </select>
          <input
            type="datetime-local"
            value={place.agendamento || ''}
            onChange={(e) => onStopChange(place.id!, 'agendamento', e.target.value)}
            className="w-full sm:w-1/2 shrink-0 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-md px-2 py-1.5 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:[color-scheme:dark] focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <button
        onClick={() => onRemove(place.id!)}
        className="text-slate-400 bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 shadow-sm rounded-md dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 p-2 sm:p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all absolute right-2 top-2 sm:right-3 sm:top-3 shrink-0"
        title="Remover do roteiro"
      >
        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>
    </Reorder.Item>
  );
}

export function RouteBuilder({ selectedPlaces, onClose, onSuccess, onClearSelection, onRemoveFromSelection }: RouteBuilderProps) {
  const [cidadesReais, setCidadesReais] = useState<string[]>([]);
  const [places, setPlaces] = useState<RouteStop[]>([]);
  const [placa, setPlaca] = useState('');
  const [operacaoGeral, setOperacaoGeral] = useState('');
  const [agendamentoGeral, setAgendamentoGeral] = useState('');
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    getCidadesBrasileiras().then(setCidadesReais);
  }, []);

  const renderCity = (city?: string) => {
    if (!city) return '';
    if (city.includes('-')) return city.replace(' - ', '-');
    if (cidadesReais.length > 0) {
      const matches = cidadesReais.filter(c => c.split(' - ')[0].toLowerCase() === city.toLowerCase());
      if (matches.length === 1) return matches[0].replace(' - ', '-');
    }
    return city;
  };
  
  useEffect(() => {
    // preserve existing stop details if the selection didn't remove them
    const newPlaces = selectedPlaces.map(p => {
      const existing = places.find(ep => ep.id === p.id);
      if (existing) return existing;
      return { ...p, operacao: '', agendamento: '' } as RouteStop;
    });
    setPlaces(newPlaces);
  }, [selectedPlaces]);

  const handleCopy = async () => {
    const message = formatRouteMessage(places, placa, observacaoGeral, operacaoGeral, agendamentoGeral);
    await navigator.clipboard.writeText(message);
    onSuccess('Programação copiada com sucesso.');
    saveRouteLog(message);
  };

  const handleShare = async () => {
    const message = formatRouteMessage(places, placa, observacaoGeral, operacaoGeral, agendamentoGeral);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    onSuccess('Redirecionado para o WhatsApp.');
    saveRouteLog(message);
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let formatted = e.target.value.toUpperCase();
    if (formatted.length === 8 && formatted[3] !== '-' && !formatted.includes('-')) {
        // Just format string roughly
        formatted = formatted.substring(0, 3) + '-' + formatted.substring(3);
    }
    setPlaca(formatted);
  };

  const handleObservacaoGeralChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacaoGeral(capitalizeText(e.target.value));
  };
  
  const handleStopChange = (id: string, field: keyof RouteStop, value: string) => {
    setPlaces(places.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveRouteLog = async (message: string) => {
    if (!user) return;
    try {
      setIsSaving(true);
      await createRoute({
        placa,
        carreta: placa, // BC
        observacaoGeral,
        operacaoGeral,
        agendamentoGeral,
        destinos: places,
        mensagemGerada: message
      }, user.uid);
      onClearSelection();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar roteiro:', err);
      // Nao vamos travar a UX se der erro de log
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = placa.trim().length > 0 && places.length > 0;

  return (
    <div className="flex flex-col max-h-[75vh]">
      <div className="flex flex-col gap-4 mb-6 relative">
        <div className="space-y-1 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Placa do Veículo *</label>
          <input
            required
            autoFocus
            value={placa}
            onChange={handlePlacaChange}
            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-4 py-2.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-widest transition-colors shadow-sm"
            placeholder="Ex: ABC-1234"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Operação Geral</label>
              <button
                type="button"
                onClick={() => {
                  if (operacaoGeral) {
                    setPlaces(places.map(p => ({ ...p, operacao: operacaoGeral })));
                  }
                }}
                className="text-[9px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
              >
                Aplicar a todas
              </button>
            </div>
            <select
              value={operacaoGeral}
              onChange={(e) => setOperacaoGeral(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Selecione...</option>
              <option value="Entrega">Entrega</option>
              <option value="Coleta">Coleta</option>
              <option value="Transferência">Transferência</option>
              <option value="Devolução">Devolução</option>
              <option value="Manutenção">Manutenção</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Agendamento Geral</label>
              <button
                type="button"
                onClick={() => {
                  if (agendamentoGeral) {
                    setPlaces(places.map(p => ({ ...p, agendamento: agendamentoGeral })));
                  }
                }}
                className="text-[9px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
              >
                Aplicar a todas
              </button>
            </div>
            <input
              type="datetime-local"
              value={agendamentoGeral}
              onChange={(e) => setAgendamentoGeral(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Observação Geral</label>
          <textarea
            value={observacaoGeral}
            onChange={handleObservacaoGeralChange}
            rows={2}
            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[80px] transition-colors"
            placeholder="Instruções adicionais para o motorista..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 border-t border-slate-200 dark:border-white/10 pt-4">
        <h3 className="block text-[10px] font-bold text-slate-500 uppercase">Sequência de Destinos ({places.length})</h3>
        <span className="text-[10px] text-slate-500 font-medium">Arraste para reordenar</span>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {places.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-white/5 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-600 uppercase font-bold">Nenhum local selecionado</span>
          </div>
        ) : (
          <Reorder.Group axis="y" values={places} onReorder={setPlaces} className="space-y-2 flex-1 pb-4">
            {places.map((place, index) => (
              <DraggableRouteStop
                key={place.id}
                place={place}
                index={index}
                renderCity={renderCity}
                onStopChange={handleStopChange}
                onRemove={onRemoveFromSelection}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
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
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Copiar
        </button>
      </div>
    </div>
  );
}
