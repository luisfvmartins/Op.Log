import { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Trash2, Copy, MapPin, Truck, Box, ArrowRightLeft, CornerUpLeft, Wrench, PackageSearch, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Place } from '../../../services/places';
import { RouteStop, RouteData, createRoute } from '../../../services/routes';
import { formatRouteMessage, formatDateToBR } from '../../../lib/formatter';
import { updatePlace } from '../../../services/places';
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
      className="flex flex-col sm:flex-row items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-hover)] rounded-xl pl-2 pr-3 py-3 relative transition-all"
    >
      <div 
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        style={{ touchAction: 'none' }}
        className="mt-1 hidden sm:flex text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-grab active:cursor-grabbing p-1.5"
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
        className="flex sm:hidden items-center justify-center w-full mb-2 pb-2 border-b border-[var(--border)] text-[var(--text-tertiary)] cursor-grab active:cursor-grabbing"
      >
         <GripVertical className="w-5 h-5 rotate-90" />
      </div>
      
      <div className="flex-1 min-w-0 pr-2 w-full">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
          <span className="bg-[var(--bg-base)] text-[var(--text-tertiary)] border border-[var(--border)] min-w-[24px] h-6 px-1 flex items-center justify-center rounded text-xs font-bold shrink-0 font-mono">
            {index + 1}
          </span>
          <span className="truncate">{place.nomeFantasia}</span>
        </h4>
        <div className="ml-0 sm:ml-[10px] space-y-0.5">
          <p className="text-xs text-[var(--text-secondary)] truncate flex items-center gap-1 font-mono"><MapPin className="w-3 h-3 text-[var(--text-tertiary)] shrink-0"/> {renderCity(place.cidade)}</p>
        </div>
        
        <div className="ml-0 sm:ml-[10px] mt-3 flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="date"
            value={(place.agendamento || '').split('T')[0]}
            onChange={(e) => {
              const date = e.target.value;
              const time = (place.agendamento || '').split('T')[1] || '';
              onStopChange(place.id!, 'agendamento', date ? (time ? `${date}T${time}` : date) : '');
            }}
            className="flex-[3] min-w-0 text-xs bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-2 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
          />
          <input
            type="time"
            value={(place.agendamento || '').split('T')[1] || ''}
            onChange={(e) => {
              const time = e.target.value;
              const date = (place.agendamento || '').split('T')[0] || new Date().toISOString().split('T')[0];
              onStopChange(place.id!, 'agendamento', time ? `${date}T${time}` : date);
            }}
            className="flex-[2] min-w-0 text-xs bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-2 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
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
  const [aguardaCarretaVazia, setAguardaCarretaVazia] = useState(false);
  
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
    const message = formatRouteMessage(places, placa, placa2, observacaoGeral, operacaoGeral, agendamentoGeral, aguardaCarretaVazia);
    await navigator.clipboard.writeText(message);
    onSuccess('Resumo copiado com sucesso.');
    saveRouteLog(message);
  };

  const handleShare = async () => {
    const message = formatRouteMessage(places, placa, placa2, observacaoGeral, operacaoGeral, agendamentoGeral, aguardaCarretaVazia);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    onSuccess('Redirecionado para o WhatsApp.');
    saveRouteLog(message);
  };

  const formatPlate = (val: string) => {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 7);
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

      // Increment routeCount for each place
      for (const p of places) {
        if (p.id) {
          const originalPlace = selectedPlaces.find(sp => sp.id === p.id);
          if (originalPlace) {
            await updatePlace(p.id, { routeCount: (originalPlace.routeCount || 0) + 1 });
          }
        }
      }

      onClearSelection();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar roteiro:', err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (operacaoGeral === 'Manutenção') {
      setPlaca('');
      setPlaca2('');
      setAguardaCarretaVazia(false);
    }
  }, [operacaoGeral]);

  const isMaintenance = operacaoGeral === 'Manutenção';
  const canGoToStep2 = operacaoGeral !== '';
  const isPlateValid = (p: string) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p);
  const canGoToStep4 = isMaintenance || aguardaCarretaVazia || (isPlateValid(placa) && (!placa2 || isPlateValid(placa2)));
  const canFinish = operacaoGeral !== '' && places.length > 0 && 
    (isMaintenance || aguardaCarretaVazia || (isPlateValid(placa) && (!placa2 || isPlateValid(placa2)) && (placa !== placa2)));

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      {/* Header/Progress */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden border border-[var(--border)]">
            <div className={`h-full transition-all duration-300 ${s <= step ? 'bg-[var(--accent)]' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar px-1">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Qual o tipo da operação?</h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {OPERATION_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setOperacaoGeral(type.id);
                    setStep(2);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${operacaoGeral === type.id ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] bg-[var(--bg-surface)]'}`}
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
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Agendamento e Locais</h2>
            
            {places.length === 1 ? (
              <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] space-y-4 z-0">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">Data (e opcionalmente Hora)</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={(agendamentoGeral || '').split('T')[0]}
                      onChange={(e) => {
                        const date = e.target.value;
                        const time = (agendamentoGeral || '').split('T')[1] || '';
                        setAgendamentoGeral(date ? (time ? `${date}T${time}` : date) : '');
                      }}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono z-0"
                    />
                    <input
                      type="time"
                      value={(agendamentoGeral || '').split('T')[1] || ''}
                      onChange={(e) => {
                        const time = e.target.value;
                        const date = (agendamentoGeral || '').split('T')[0] || new Date().toISOString().split('T')[0];
                        setAgendamentoGeral(time ? `${date}T${time}` : date);
                      }}
                      className="w-full max-w-[120px] bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono z-0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">Arraste para reordenar</span>
                  <button onClick={applyAgendamentoToAll} className="text-[10px] sm:text-xs font-semibold text-[var(--text-primary)] hover:opacity-80 bg-[var(--bg-base)] border border-[var(--border)] px-2 py-1.5 rounded-md transition-colors">
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
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Implementos (Carretas)</h2>
            
            <div className="space-y-4">
              <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] space-y-4">
                {isMaintenance ? (
                  <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-tertiary)] flex items-center gap-2">
                    <Wrench className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                    <span>Operação de Manutenção: inserção de carreta desabilitada.</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <input
                        type="checkbox"
                        id="aguardaCarreta"
                        checked={aguardaCarretaVazia}
                        onChange={(e) => {
                           setAguardaCarretaVazia(e.target.checked);
                           if (e.target.checked) setPlaca('');
                        }}
                        className="w-4 h-4 rounded-sm border-[var(--border)] bg-[var(--bg-base)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      <label htmlFor="aguardaCarreta" className="text-sm font-medium text-[var(--text-primary)]">
                        Aguardar motorista avisar carreta
                      </label>
                    </div>

                    {!aguardaCarretaVazia && (
                      <>
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-2">Carreta 1 *</label>
                          <input
                            required={!aguardaCarretaVazia}
                            value={placa}
                            onChange={handlePlacaChange}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3 text-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] font-mono tracking-widest transition-all uppercase"
                            placeholder="ABC1B34"
                            maxLength={7}
                          />
                          {placa.length > 0 && !isPlateValid(placa) && <span className="text-xs text-[#E05252] mt-1 block">Placa inválida</span>}
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-2">Carreta 2 (Opcional)</label>
                          <input
                            value={placa2}
                            onChange={handlePlaca2Change}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3 text-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] font-mono tracking-widest transition-all uppercase"
                            placeholder="XYZ9W87"
                            maxLength={7}
                          />
                           {placa2.length > 0 && !isPlateValid(placa2) && <span className="text-xs text-[#E05252] mt-1 block">Placa inválida</span>}
                           {placa2.length > 0 && placa2 === placa && <span className="text-xs text-[#E05252] mt-1 block">As placas devem ser diferentes</span>}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] space-y-2">
                 <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Observações da Operação (Opcional)</label>
                 <textarea
                    value={observacaoGeral}
                    onChange={e => setObservacaoGeral(e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none transition-all"
                    placeholder="Conferir documentação, prioridade de descarga..."
                  />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Confira os dados antes de finalizar</h2>
            
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
               <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-surface)]">
                 <div>
                   <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] tracking-wider">Tipo de operação</span>
                   <p className="font-semibold text-[var(--text-primary)]">{operacaoGeral}</p>
                 </div>
                 <button onClick={() => setStep(1)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-medium hover:underline">Editar</button>
               </div>
               
               <div className="p-4 border-b border-[var(--border)] relative bg-[var(--bg-surface)]">
                 <div className="flex justify-between items-end mb-3">
                   <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] tracking-wider block">Locais e Agendamentos</span>
                   <button onClick={() => setStep(2)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-medium hover:underline">Editar</button>
                 </div>
                 <div className="space-y-3">
                   {places.map((place, i) => {
                     const agendamentoInfo = places.length === 1 && agendamentoGeral ? agendamentoGeral : place.agendamento;
                     return (
                     <div key={place.id} className="text-sm">
                       <span className="font-medium text-[var(--text-primary)]">{i + 1}. {place.nomeFantasia}</span>
                       {agendamentoInfo && <span className="block text-[var(--text-secondary)] font-mono text-xs mt-0.5 ml-4">• {formatDateToBR(agendamentoInfo)}</span>}
                     </div>
                   )})}
                 </div>
               </div>
               
               <div className="p-4 border-b border-[var(--border)] flex justify-between items-start bg-[var(--bg-surface)]">
                 <div>
                   <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] tracking-wider block mb-2">Implementos (Carretas)</span>
                   <div className="space-y-1 text-sm font-mono">
                     {isMaintenance ? (
                       <p className="text-[var(--text-tertiary)] italic">Manutenção (Sem carreta)</p>
                     ) : aguardaCarretaVazia ? (
                       <p className="text-[var(--accent)] font-medium">Aguardar motorista avisar carreta</p>
                     ) : (
                       <>
                         {placa && <p className="text-[var(--text-primary)]"><span className="text-[var(--text-secondary)]">Carreta 1:</span> {placa}</p>}
                         {placa2 && <p className="text-[var(--text-primary)]"><span className="text-[var(--text-secondary)]">Carreta 2:</span> {placa2}</p>}
                       </>
                     )}
                   </div>
                 </div>
                 <button onClick={() => setStep(3)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-medium hover:underline">Editar</button>
               </div>

               {observacaoGeral && (
                 <div className="p-4 relative bg-[var(--bg-surface)]">
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] tracking-wider block">Observações</span>
                     <button onClick={() => setStep(3)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-medium hover:underline">Editar</button>
                   </div>
                   <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{observacaoGeral}</p>
                 </div>
               )}
            </div>
            
            {!canFinish && (
              <div className="p-4 bg-[var(--bg-surface)] border border-[#E05252]/30 rounded-xl text-sm text-[#E05252] font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E05252] animate-pulse" />
                Pendências encontradas nas etapas anteriores. Verifique os campos obrigatórios.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--bg-surface)] z-10 shrink-0">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-base)] hover:bg-transparent border border-[var(--border)] rounded-md transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancelar
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !canGoToStep2) || (step === 3 && !canGoToStep4)}
            className="px-6 py-3 text-sm font-medium text-[#0C0D0F] bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
          >
            Avançar
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleCopy}
              disabled={!canFinish || isSaving}
              className="flex items-center justify-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] px-5 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copiar Resumo</span>
              <span className="sm:hidden">Copiar</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!canFinish || isSaving}
              className="flex items-center justify-center gap-2 bg-[#4CAF7D] hover:bg-[#4CAF7D]/80 text-[#0C0D0F] px-5 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
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

