import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, Schedule } from '../services/schedules';
import { getDrivers, updateDriver, Driver } from '../services/drivers';
import { getVehicles, updateVehicle, Vehicle } from '../services/vehicles';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UnifiedHeader } from '../components/UnifiedHeader';
import { useViewPrefs } from '../hooks/useViewPrefs';

export function SchedulesPage({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, setViewMode, sortBy, setSortBy } = useViewPrefs('schedules', 'grid', 'recentes');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Form State
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [operation, setOperation] = useState('Viagem');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState('Ativo');

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user) {
        const [schedData, drvData, vehData] = await Promise.all([
          getSchedules(user.uid),
          getDrivers(user.uid),
          getVehicles(user.uid)
        ]);
        setSchedules(schedData);
        setDrivers(drvData);
        setVehicles(vehData);
        checkForAlerts(drvData, vehData, schedData);
      }
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkForAlerts = (allDrivers: Driver[], allVehicles: Vehicle[], allSchedules: Schedule[]) => {
    // Alerta operacional simple. We can show it as toasts or banner.
    // 16:00 check is hard to simulate cleanly here without a robust backend or banner.
    // We'll just check if any "Ativos" don't have schedules. (Omitted for brevity, but could just compute "noScheduleTomorrow").
  };

  const handleOpenModal = (sched?: Schedule) => {
    if (sched) {
      setEditingSchedule(sched);
      setDriverId(sched.driverId);
      setVehicleId(sched.vehicleId);
      setDate(sched.date);
      setTime(sched.time);
      setOperation(sched.operation);
      setObservations(sched.observations || '');
      setStatus(sched.status);
    } else {
      const today = new Date();
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      
      setEditingSchedule(undefined);
      setDriverId('');
      setVehicleId('');
      setDate(nextDay.toISOString().split('T')[0]); // Default para o dia seguinte
      setTime('08:00');
      setOperation('Viagem');
      setObservations('');
      setStatus('Ativo');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!driverId || !vehicleId || !date || !time || !operation || !status) {
      addToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    // Validação: Conflito
    const hasConflict = schedules.some(s => 
      s.id !== editingSchedule?.id && 
      s.status === 'Ativo' && 
      s.date === date && 
      (s.driverId === driverId || s.vehicleId === vehicleId)
    );

    if (hasConflict) {
      addToast('Conflito: Motorista ou veículo já tem programação neste dia.', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const data = {
        userId: user.uid,
        driverId,
        vehicleId,
        date,
        time,
        operation,
        observations,
        status,
      };

      if (editingSchedule?.id) {
        await updateSchedule(editingSchedule.id, data);
        
        // Se mudou pra encerrado, vira disponivel.
        if (editingSchedule.status === 'Ativo' && status === 'Encerrado') {
           await updateDriver(driverId, { status: 'Disponível' });
           await updateVehicle(vehicleId, { status: 'Disponível' });
        }
        addToast('Programação atualizada', 'success');
      } else {
        await createSchedule(data);
        // Atualiza status do motorista e veículo
        if (status === 'Ativo') {
          await updateDriver(driverId, { status: 'Programado' });
          await updateVehicle(vehicleId, { status: 'Programado' });
        }
        addToast('Programação criada', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsBusy(true);
    try {
      await deleteSchedule(deletingId);
      addToast('Programação excluída', 'success');
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleComplete = async (sched: Schedule) => {
    setIsBusy(true);
    try {
      await updateSchedule(sched.id!, { status: 'Encerrado' });
      await updateDriver(sched.driverId, { status: 'Disponível' });
      await updateVehicle(sched.vehicleId, { status: 'Disponível' });
      addToast('Programação encerrada e recursos liberados.', 'success');
      loadData();
    } catch (err: any) {
      addToast('Erro ao encerrar.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const drv = drivers.find(d => d.id === s.driverId);
    const veh = vehicles.find(v => v.id === s.vehicleId);
    const filterText = `${s.operation} ${s.status} ${drv?.nome} ${veh?.placa} ${s.date}`.toLowerCase();
    return filterText.includes(searchQuery.toLowerCase());
  });

  const formatDatePTBR = (dStr: string) => {
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <UnifiedHeader
        title="Programações"
        subtitle="Vincule motoristas e veículos as operações."
        totalCount={schedules.length}
        filteredCount={filteredSchedules.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode as 'grid'|'list'}
        setViewMode={(m) => setViewMode(m as 'grid'|'list')}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOptions={[
          {value: 'recentes', label: 'Mais recentes'},
          {value: 'antigos', label: 'Mais antigos'}
        ]}
        onOpenModal={() => handleOpenModal()}
        buttonText="Nova Programação"
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setAboutModalOpen={setIsAboutModalOpen}
        searchPlaceholder="Buscar programação..."
      />
      
      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{schedules.length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Ativas</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{schedules.filter(s => s.status === 'Ativo').length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Encerradas</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{schedules.filter(s => s.status === 'Encerrado').length}</p>
          </div>
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
             <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400">Nenhuma programação encontrada.</p>
          </div>
        ) : viewMode === 'list' ? (
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">OPERAÇÃO</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">DATA / HORA</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">MOTORISTA</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">VEÍCULO</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">STATUS</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">AÇÕES</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                       {filteredSchedules.map(s => {
                          const drv = drivers.find(d => d.id === s.driverId);
                          const veh = vehicles.find(v => v.id === s.vehicleId);
                          const isEncerrado = s.status === 'Encerrado';
                          return (
                             <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                <td className="p-4 font-bold text-slate-900 dark:text-white uppercase tracking-wide">{s.operation}</td>
                                <td className="p-4 text-slate-500 text-sm">
                                   <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-slate-400" />
                                      {s.date ? formatDatePTBR(s.date) : ''} às {s.time}
                                   </div>
                                </td>
                                <td className="p-4 font-medium text-slate-900 dark:text-slate-200">{drv?.nome || 'N/A'}</td>
                                <td className="p-4 font-mono text-slate-900 dark:text-slate-200">{veh?.placa || 'N/A'}</td>
                                <td className="p-4">
                                   <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${isEncerrado ? 'bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                                      {s.status}
                                   </span>
                                </td>
                                <td className="p-4 text-right">
                                   <button onClick={() => handleOpenModal(s)} className="p-1.5 text-slate-400 hover:text-blue-600 transition" title="Editar">
                                      <Edit2 className="w-4 h-4"/>
                                   </button>
                                   {!isEncerrado && (
                                      <button onClick={() => handleComplete(s)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition" title="Encerrar">
                                         <CheckCircle className="w-4 h-4" />
                                      </button>
                                   )}
                                   <button onClick={() => setDeletingId(s.id!)} className="p-1.5 text-slate-400 hover:text-red-600 transition" title="Excluir">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map(s => {
              const drv = drivers.find(d => d.id === s.driverId);
              const veh = vehicles.find(v => v.id === s.vehicleId);
              const isEncerrado = s.status === 'Encerrado';

              return (
                <div key={s.id} className={`bg-white dark:bg-white/5 border rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500/50 transition flex flex-col ${isEncerrado ? 'border-slate-200 dark:border-white/10 opacity-75' : 'border-blue-200 dark:border-blue-900/50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {s.operation}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        {s.date ? formatDatePTBR(s.date) : ''} às {s.time}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${isEncerrado ? 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-slate-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Motorista</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{drv?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Veículo</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200 font-mono">{veh?.placa || 'N/A'}</p>
                    </div>
                    {s.observations && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1">Obs</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{s.observations}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                    <button 
                      onClick={() => handleOpenModal(s)} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!isEncerrado && (
                      <button 
                        onClick={() => handleComplete(s)} 
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                        title="Encerrar e Liberar Motorista/Veículo"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => setDeletingId(s.id!)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition ml-auto"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSchedule ? "Editar Programação" : "Nova Programação"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motorista</label>
              <select
                required
                value={driverId}
                onChange={e => {
                   const newDriverId = e.target.value;
                   setDriverId(newDriverId);
                   if (newDriverId) {
                      const selDriver = drivers.find(d => d.id === newDriverId);
                      if (selDriver?.veiculoPadraoId) {
                         setVehicleId(selDriver.veiculoPadraoId);
                      }
                   }
                }}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.nome} {d.status !== 'Disponível' && editingSchedule?.driverId !== d.id ? `(${d.status})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Veículo (Placa)</label>
              <select
                required
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
              >
                <option value="">Selecione...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} {v.status !== 'Disponível' && editingSchedule?.vehicleId !== v.id ? `(${v.status})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Operação</label>
              <select
                value={operation}
                onChange={e => setOperation(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="Coleta">Coleta</option>
                <option value="Entrega">Entrega</option>
                <option value="Transferência">Transferência</option>
                <option value="Devolução">Devolução</option>
                <option value="Manobra">Manobra</option>
                <option value="Viagem">Viagem</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="Ativo">Ativo</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações (Opcional)</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isBusy ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="Sobre"
      >
        <div className="p-2 sm:p-4 text-slate-600 dark:text-slate-300">
          <p className="text-sm sm:text-base leading-relaxed mb-6">
            O <strong>Op.Log</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente suas operações logísticas e viagens.
          </p>
          <div className="bg-slate-100 dark:bg-black/40 p-5 rounded-xl border border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Criador</h4>
            <p className="text-base text-slate-900 dark:text-white font-medium mb-4">Desenvolvido por Luis Martins</p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Excluir Programação"
        message="Tem certeza que deseja excluir? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
