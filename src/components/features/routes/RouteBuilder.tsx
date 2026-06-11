import { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Trash2, Copy, MapPin, Truck, Box, ArrowRightLeft, CornerUpLeft, Wrench, PackageSearch, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Place } from '../../../services/places';
import { RouteStop, RouteData } from '../../../services/routes';
import { formatRouteMessage, capitalizeText, formatDateToBR } from '../../../lib/formatter';
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
}: {
  place: RouteStop;
  index: number;
  renderCity: (city?: string) => string;
  onStopChange: (id: string, field: keyof RouteStop, value: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={place}
      id={place.id!}
      dragListener={false}
      dragControls={controls}
      className="flex flex-col sm:flex-row items-start gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-xl pl-2 pr-3 py-3 relative transition-all"
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
      
      <div className="flex-1 min-w-0 pr-2 w-full">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 min-w-[24px] h-6 px-1 flex items-center justify-center rounded text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <span className="truncate">{place.nomeFantasia}</span>
        </h4>
        <div className="ml-0 sm:ml-[10px] space-y-0.5">
          <p className="text-xs text-slate-500 truncate flex items-center gap-1 font-medium"><MapPin className="w-3 h-3 text-slate-400 shrink-0"/> {renderCity(place.cidade)}</p>
        </div>
        
        <div className="ml-0 sm:ml-[10px] mt-3" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="datetime-local"
            value={place.agendamento || ''}
            onChange={(e) => onStopChange(place.id!, 'agendamento', e.target.value)}
            className="w-full shrink-0 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-md px-2 py-2 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:[color-scheme:dark] focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </Reorder.Item>
  );
}

const OPERATION_TYPES = [
  { id: 'Entrega', label: 'Entrega', icon: Truck },
  { id: 'Coleta', label: 'Coleta', icon: Box },
  { id: 'Transferência', label: 'Transferência', icon: ArrowRightLeft },
  { id: 'Devolução', label: 'Devolução', icon: CornerUpLeft },
  { id: 'Manutenção', label: 'Manutenção', icon: Wrench },
  { id: 'Misto', label: 'Misto', icon: PackageSearch },
];

export function RouteBuilder({ selectedPlaces, onClose, onSuccess, onClearSelection, onRemoveFromSelection }: RouteBuilderProps) {
  const [step, setStep] = useState(1);
  const [cidadesReais, setCidadesReais] = useState<string[]>([]);
  const [places, setPlaces] = useState<RouteStop[]>([]);
  
  const [operacaoGeral, setOperacaoGeral] = useState('');
  const [agendamentoGeral, setAgendamentoGeral] = useState('');
  const [placa, setPlaca] = useState('');
  const [placa2, setPlaca2] = useState('');
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
    const newPlaces = selectedPlaces.map(p => {
      const existing = places.find(ep => ep.id === p.id);
      if (existing) return existing;
      return { ...p, operacao: '', agendamento: '' } as RouteStop;
    });
    setPlaces(newPlaces);
  }, [selectedPlaces]);

  const handleCopy = async () => {
    const message = formatRouteMessage(places, placa, placa2, observacaoGeral, operacaoGeral, agendamentoGeral);
    await navigator.clipboard.writeText(message);
    onSuccess('Resumo copiado com sucesso.');
    saveRouteLog(message);
  };

  const handleShare = async () => {
    const message = formatRouteMessage(places, placa, placa2, observacaoGeral, operacaoGeral, agendamentoGeral);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    onSuccess('Redirecionado para o WhatsApp.');
    saveRouteLog(message);
  };

  const formatPlate = (val: string) => {
    let formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formatted.length > 3 && !formatted.includes('-')) {
        formatted = formatted.substring(0, 3) + '-' + formatted.substring(3, 7);
    }
    return formatted;
  }

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaca(formatPlate(e.target.value));
  };
  
  const handlePlaca2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaca2(formatPlate(e.target.value));
  };

  const handleStopChange = (id: string, field: keyof RouteStop, value: string) => {
    setPlaces(places.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const applyAgendamentoToAll = () => {
    if (places.length > 0 && places[0].agendamento) {
      const startValue = places[0].agendamento;
      setPlaces(places.map(p => ({ ...p, agendamento: startValue })));
    }
  };

  const saveRouteLog = async (message: string) => {
    if (!user) return;
    try {
      setIsSaving(true);
      await createRoute({
        placa,
        placa2,
        carreta: placa, 
        observacaoGeral,
        operacaoGeral,
        agendamentoGeral,
        destinos: places,
        mensagemGerada: message
      } as RouteData, user.uid);
      onClearSelection();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar roteiro:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const canGoToStep2 = operacaoGeral !== '';
  const isPlateValid = (p: string) => /^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$/.test(p);
  const canGoToStep4 = isPlateValid(placa) && (!placa2 || isPlateValid(placa2));
  const canFinish = operacaoGeral !== '' && places.length > 0 && isPlateValid(placa) && (!placa2 || isPlateValid(placa2)) && (placa !== placa2);

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      {/* Header/Progress */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div className={`h-full transition-all duration-300 ${s <= step ? 'bg-blue-500' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar px-1">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Qual o tipo da operação?</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {OPERATION_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setOperacaoGeral(type.id);
                    setStep(2);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${operacaoGeral === type.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5'}`}
                >
                  <type.icon className="w-8 h-8 mb-2 opacity-80" />
                  <span className="font-semibold text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Agendamento e Locais</h2>
            
            {places.length === 1 ? (
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data e Hora</label>
                  <input
                    type="datetime-local"
                    value={agendamentoGeral}
                    onChange={(e) => setAgendamentoGeral(e.target.value)}
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark] transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-500">Arraste para reordenar</span>
                  <button onClick={applyAgendamentoToAll} className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 bg-blue-50 dark:bg-blue-500/10 px-2 py-1.5 rounded-lg transition-colors">
                    Aplicar primeiro a todos
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <Reorder.Group axis="y" values={places} onReorder={setPlaces} className="space-y-2 pb-4">
                    {places.map((place, index) => (
                      <DraggableRouteStop
                        key={place.id}
                        place={place}
                        index={index}
                        renderCity={renderCity}
                        onStopChange={handleStopChange}
                      />
                    ))}
                  </Reorder.Group>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Qual(is) carreta(s) será(ão) utilizada(s)?</h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Carreta 1 *</label>
                  <input
                    required
                    value={placa}
                    onChange={handlePlacaChange}
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest transition-all uppercase"
                    placeholder="ABC-1B34"
                    maxLength={8}
                  />
                  {placa.length > 0 && !isPlateValid(placa) && <span className="text-xs text-red-500 mt-1 block">Placa inválida</span>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Carreta 2 (Opcional)</label>
                  <input
                    value={placa2}
                    onChange={handlePlaca2Change}
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest transition-all uppercase"
                    placeholder="XYZ-9W87"
                    maxLength={8}
                  />
                   {placa2.length > 0 && !isPlateValid(placa2) && <span className="text-xs text-red-500 mt-1 block">Placa inválida</span>}
                   {placa2.length > 0 && placa2 === placa && <span className="text-xs text-red-500 mt-1 block">As placas devem ser diferentes</span>}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações da Operação (Opcional)</label>
                 <textarea
                    value={observacaoGeral}
                    onChange={e => setObservacaoGeral(capitalizeText(e.target.value))}
                    rows={3}
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                    placeholder="Conferir documentação, prioridade de descarga..."
                  />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Confira os dados antes de finalizar</h2>
            
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
               <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
                 <div>
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo de operação</span>
                   <p className="font-semibold text-slate-900 dark:text-white">{operacaoGeral}</p>
                 </div>
                 <button onClick={() => setStep(1)} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Editar</button>
               </div>
               
               <div className="p-4 border-b border-slate-200 dark:border-white/10 relative bg-white dark:bg-white/5">
                 <div className="flex justify-between items-end mb-3">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Locais e Agendamentos</span>
                   <button onClick={() => setStep(2)} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Editar</button>
                 </div>
                 <div className="space-y-3">
                   {places.map((place, i) => {
                     const agendamentoInfo = places.length === 1 && agendamentoGeral ? agendamentoGeral : place.agendamento;
                     return (
                     <div key={place.id} className="text-sm">
                       <span className="font-medium text-slate-900 dark:text-white">{i + 1}. {place.nomeFantasia}</span>
                       {agendamentoInfo && <span className="block text-slate-500 mt-0.5 ml-4">• {formatDateToBR(agendamentoInfo)}</span>}
                     </div>
                   )})}
                 </div>
               </div>
               
               <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-start bg-white dark:bg-white/5">
                 <div>
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Implementos</span>
                   <div className="space-y-1 text-sm">
                     <p className="text-slate-900 dark:text-white"><span className="text-slate-500">Carreta 1:</span> {placa}</p>
                     {placa2 && <p className="text-slate-900 dark:text-white"><span className="text-slate-500">Carreta 2:</span> {placa2}</p>}
                   </div>
                 </div>
                 <button onClick={() => setStep(3)} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Editar</button>
               </div>

               {observacaoGeral && (
                 <div className="p-4 relative bg-white dark:bg-white/5">
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Observações</span>
                     <button onClick={() => setStep(3)} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Editar</button>
                   </div>
                   <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{observacaoGeral}</p>
                 </div>
               )}
            </div>
            
            {!canFinish && (
              <div className="p-4 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Pendências encontradas nas etapas anteriores. Verifique os campos obrigatórios.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 z-10 shrink-0">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Cancelar
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !canGoToStep2) || (step === 3 && !canGoToStep4)}
            className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20 ml-auto"
          >
            Avançar
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleCopy}
              disabled={!canFinish || isSaving}
              className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copiar Resumo</span>
              <span className="sm:hidden">Copiar</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!canFinish || isSaving}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4 hidden sm:inline" />
              WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
