import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut, FileText, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, Schedule } from '../services/schedules';
import { getDrivers, updateDriver, createDriver, Driver } from '../services/drivers';
import { getVehicles, updateVehicle, createVehicle, Vehicle } from '../services/vehicles';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UnifiedHeader } from '../components/UnifiedHeader';
import { useViewPrefs } from '../hooks/useViewPrefs';
import { usePlaces } from '../hooks/usePlaces';

import { AboutModal } from '../components/ui/AboutModal';

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
  
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Form State
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [operations, setOperations] = useState<string[]>(['Viagem']);
  const [locationSearchDisplay, setLocationSearchDisplay] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState('Ativo');
  
  const { places, loading: placesLoading } = usePlaces();

  const [driverSearchDisplay, setDriverSearchDisplay] = useState('');
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);

  const [vehicleSearchDisplay, setVehicleSearchDisplay] = useState('');
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);

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

  const loadDrivers = async () => {
    if (user) {
       const drvData = await getDrivers(user.uid);
       setDrivers(drvData);
    }
  };

  const loadVehicles = async () => {
    if (user) {
       const vehData = await getVehicles(user.uid);
       setVehicles(vehData);
    }
  };

  const handleQuickCreateDriver = async (nome: string) => {
    if (!user) return;
    setIsBusy(true);
    try {
      const did = await createDriver({
        userId: user.uid,
        nome: nome.trim(),
        tipo: 'Regional',
        inicioJornada: '08:00',
        fimJornada: '18:00',
        status: 'Disponível'
      });
      addToast('Motorista criado e vinculado.', 'success');
      await loadDrivers();
      setDriverId(did);
      setDriverSearchDisplay(nome.trim());
      setDriverDropdownOpen(false);
    } catch(err) {
      addToast('Erro ao criar motorista', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleQuickCreateVehicle = async (placa: string) => {
    if (!user) return;
    setIsBusy(true);
    try {
      const vid = await createVehicle({
        userId: user.uid,
        placa: placa.toUpperCase(),
        tipo: 'Trucado',
        status: 'Disponível'
      });
      addToast('Veículo criado e vinculado.', 'success');
      await loadVehicles();
      setVehicleId(vid);
      setVehicleSearchDisplay(placa.toUpperCase());
      setVehicleDropdownOpen(false);
    } catch(err) {
      addToast('Erro ao criar veículo', 'error');
    } finally {
      setIsBusy(false);
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
      
      const opArr = sched.operations || (sched.operation ? (Array.isArray(sched.operation) ? sched.operation : [sched.operation]) : []);
      setOperations(opArr);
      
      setLocationSearchDisplay(sched.locationName || '');
      
      setObservations(sched.observations || '');
      setStatus(sched.status);
      
      const d = drivers.find(d => d.id === sched.driverId);
      setDriverSearchDisplay(d?.nome || '');
      const v = vehicles.find(v => v.id === sched.vehicleId);
      setVehicleSearchDisplay(v?.placa || '');
    } else {
      const today = new Date();
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      
      setEditingSchedule(undefined);
      setDriverId('');
      setVehicleId('');
      setDate(nextDay.toISOString().split('T')[0]); // Default para o dia seguinte
      setTime('08:00');
      setOperations(['Viagem']);
      setLocationSearchDisplay('');
      setObservations('');
      setStatus('Ativo');
      
      setDriverSearchDisplay('');
      setVehicleSearchDisplay('');
    }
    setDriverDropdownOpen(false);
    setVehicleDropdownOpen(false);
    setLocationDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!driverId || !vehicleId || !date || !time || operations.length === 0 || !status) {
      addToast('Preencha todos os campos obrigatórios', 'error');
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
      const locationMatch = places.find(p => p.cidade === locationSearchDisplay || p.nomeFantasia === locationSearchDisplay || p.nomeRazaoSocial === locationSearchDisplay);
      
      const data = {
        userId: user.uid,
        driverId,
        vehicleId,
        date,
        time,
        operation: operations[0] || '', // compat
        operations,
        locationId: locationMatch?.id || '',
        locationName: locationSearchDisplay.trim(),
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

  const activeSchedules = schedules.filter(s => s.status === 'Ativo');
  
  const metrics = {
    emOperacao: activeSchedules.length,
    coletas: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Coleta')).length,
    entregas: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Entrega')).length,
    transferencias: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Transferência')).length,
    manobras: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Manobra')).length,
    pendencias: activeSchedules.filter(s => s.observations && s.observations.trim().length > 0).length,
    folgas: drivers.filter(d => ['Folga', 'Férias', 'Afastado'].includes(d.status)).length,
    semProgramacao: drivers.filter(d => 
      !['Folga', 'Férias', 'Afastado'].includes(d.status) &&
      !activeSchedules.some(s => s.driverId === d.id)
    ).length
  };

  const filteredItems = () => {
    // Return what should be displayed on screen based on the active dashboard filter
    if (dashboardFilter === 'emOperacao') return activeSchedules;
    if (dashboardFilter === 'coletas') return activeSchedules.filter(s => (s.operations || [s.operation]).includes('Coleta'));
    if (dashboardFilter === 'entregas') return activeSchedules.filter(s => (s.operations || [s.operation]).includes('Entrega'));
    if (dashboardFilter === 'transferencias') return activeSchedules.filter(s => (s.operations || [s.operation]).includes('Transferência'));
    if (dashboardFilter === 'manobras') return activeSchedules.filter(s => (s.operations || [s.operation]).includes('Manobra'));
    if (dashboardFilter === 'pendencias') return activeSchedules.filter(s => s.observations && s.observations.trim().length > 0);
    
    // For folgas and semProgramacao, we are showing drivers instead of schedules!
    // But since the main list is meant for schedules, we'll create "fake" schedules just for display, or render a different component.
    // Let's create fake schedule objects to reuse the same table and card rendering.
    if (dashboardFilter === 'folgas') {
      const dFolgas = drivers.filter(d => ['Folga', 'Férias', 'Afastado'].includes(d.status));
      return dFolgas.map(d => {
         const v = vehicles.find(vh => vh.id === d.veiculoPadraoId);
         return { id: `drv-${d.id}`, driverId: d.id, vehicleId: v?.id || '', date: '', time: '', operation: d.status, operations: [d.status], status: d.status } as Schedule;
      });
    }
    if (dashboardFilter === 'semProgramacao') {
      const dSem = drivers.filter(d => !['Folga', 'Férias', 'Afastado'].includes(d.status) && !activeSchedules.some(s => s.driverId === d.id));
      return dSem.map(d => {
         const v = vehicles.find(vh => vh.id === d.veiculoPadraoId);
         return { id: `drv-${d.id}`, driverId: d.id, vehicleId: v?.id || '', date: '', time: `${d.inicioJornada || '08:00'} - ${d.fimJornada || '18:00'}`, operation: 'Sem Programação', operations: ['Sem Programação'], status: 'Disponível' } as Schedule;
      });
    }
    
    // Default search filter
    return schedules.filter(s => {
      const drv = drivers.find(d => d.id === s.driverId);
      const veh = vehicles.find(v => v.id === s.vehicleId);
      const opArr = s.operations || (s.operation ? (Array.isArray(s.operation) ? s.operation : [s.operation]) : []);
      const filterText = `${opArr.join(' ')} ${s.status} ${drv?.nome} ${veh?.placa} ${s.date} ${s.locationName || ''}`.toLowerCase();
      return filterText.includes(searchQuery.toLowerCase());
    });
  };

  const generateReport = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    let rpt = `📊 *RELATÓRIO OPERACIONAL | ${today}*\n\n`;

    const getDriverName = (driverId: string) => drivers.find(d => d.id === driverId)?.nome || '(Sem motorista)';
    const getVehiclePlate = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.placa || 'SEM CAVALO';
    const getDriverJornada = (driverId: string) => {
        const d = drivers.find(d => d.id === driverId);
        if (!d) return '[08:00 às 18:00]';
        return `[${d.inicioJornada || '08:00'} às ${d.fimJornada || '18:00'}]`;
    };

    const sortSchedules = (list: Schedule[]) => {
      return [...list].sort((a, b) => getDriverName(a.driverId).localeCompare(getDriverName(b.driverId)));
    };
    
    const sortDriversList = (list: Driver[]) => {
      return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
    };

    // 1. PENDÊNCIAS OPERACIONAIS
    const pended = sortSchedules(activeSchedules.filter(s => s.observations && s.observations.trim().length > 0));
    if (pended.length > 0) {
      rpt += `──────────────────\n⚠️ PENDÊNCIAS OPERACIONAIS\n──────────────────\n\n`;
      pended.forEach(s => {
        rpt += `🟡 \`${getVehiclePlate(s.vehicleId)}\` ${getDriverName(s.driverId).toUpperCase()} - ${getDriverJornada(s.driverId)} | *${s.observations}*\n\n`;
      });
    }

    // Categorization
    const opsByCli: Record<string, Schedule[]> = {};
    const colEntArr: Schedule[] = [];
    const tripsByReg: Record<string, Schedule[]> = {};

    activeSchedules.forEach(s => {
        const opArr = s.operations || [s.operation];
        
        if (opArr.includes('Viagem')) {
            const loc = (s.locationName || 'Diversas Regiões').toUpperCase();
            if (!tripsByReg[loc]) tripsByReg[loc] = [];
            tripsByReg[loc].push(s);
        } else if (opArr.includes('Coleta') || opArr.includes('Entrega') || opArr.includes('Transferência')) {
            colEntArr.push(s);
        } else {
            const loc = (s.locationName || 'OUTRAS OPERAÇÕES').toUpperCase();
            if (!opsByCli[loc]) opsByCli[loc] = [];
            opsByCli[loc].push(s);
        }
    });

    // 2. OPERAÇÃO CLIENTE
    const cliKeys = Object.keys(opsByCli).sort();
    cliKeys.forEach(cli => {
        if (opsByCli[cli].length > 0) {
            rpt += `──────────────────\n🚛 OPERAÇÃO ${cli}\n──────────────────\n\n`;
            sortSchedules(opsByCli[cli]).forEach(s => {
                const opsStr = (s.operations || [s.operation]).join(', ');
                rpt += `🟢 \`${getVehiclePlate(s.vehicleId)}\` ${getDriverName(s.driverId).toUpperCase()} - ${opsStr} ${s.locationName ? s.locationName : ''}`.trim() + `\n\n`;
            });
        }
    });

    // 3. COLETAS / ENTREGAS
    if (colEntArr.length > 0) {
        rpt += `──────────────────\n🚚 COLETAS / ENTREGAS\n──────────────────\n\n`;
        sortSchedules(colEntArr).forEach(s => {
            const opsStr = (s.operations || [s.operation]).join(', ');
            rpt += `🟢 \`${getVehiclePlate(s.vehicleId)}\` ${getDriverName(s.driverId).toUpperCase()} - ${opsStr} ${s.locationName ? s.locationName : ''}`.trim() + `\n\n`;
        });
    }

    // 4. REGIÕES (Viagens)
    const tripKeys = Object.keys(tripsByReg).sort();
    tripKeys.forEach(reg => {
       if (tripsByReg[reg].length > 0) {
           rpt += `──────────────────\n🌎 ${reg}\n──────────────────\n\n`;
           sortSchedules(tripsByReg[reg]).forEach(s => {
               rpt += `🔵 \`${getVehiclePlate(s.vehicleId)}\` ${getDriverName(s.driverId).toUpperCase()} - ${s.locationName ? s.locationName : 'EM VIAGEM'}\n\n`;
           });
       }
    });

    // 5. FOLGA / FÉRIAS / AFASTAMENTOS
    const folgas = sortDriversList(drivers.filter(d => ['Folga', 'Férias', 'Afastado'].includes(d.status)));
    if (folgas.length > 0) {
        rpt += `──────────────────\n🟡 FOLGA / FÉRIAS / AFASTAMENTOS\n──────────────────\n\n`;
        folgas.forEach(d => {
            const placa = getVehiclePlate(d.veiculoPadraoId || '');
            const jorna = `[${d.inicioJornada || '08:00'} às ${d.fimJornada || '18:00'}]`;
            rpt += `🟡 \`${placa}\` ${d.nome.toUpperCase()} - ${jorna} | *${d.status.toUpperCase()}*\n\n`;
        });
    }

    // 6. SEM PROGRAMAÇÃO
    const semProg = sortDriversList(drivers.filter(d => 
        !['Folga', 'Férias', 'Afastado'].includes(d.status) &&
        !activeSchedules.some(s => s.driverId === d.id)
    ));
    if (semProg.length > 0) {
        rpt += `──────────────────\n⚪ SEM PROGRAMAÇÃO\n──────────────────\n\n`;
        semProg.forEach(d => {
            const placa = getVehiclePlate(d.veiculoPadraoId || '');
            const jorna = `[${d.inicioJornada || '08:00'} às ${d.fimJornada || '18:00'}]`;
            rpt += `⚪ \`${placa}\` ${d.nome.toUpperCase()} - ${jorna}\n\n`;
        });
    }

    return rpt.trim() + '\n';
  };

  const itemsToDisplay = filteredItems().sort((a, b) => {
    if (sortBy === 'az') {
      const drvA = drivers.find(d => d.id === a.driverId)?.nome || '';
      const drvB = drivers.find(d => d.id === b.driverId)?.nome || '';
      return drvA.localeCompare(drvB);
    } else if (sortBy === 'za') {
      const drvA = drivers.find(d => d.id === a.driverId)?.nome || '';
      const drvB = drivers.find(d => d.id === b.driverId)?.nome || '';
      return drvB.localeCompare(drvA);
    } else if (sortBy === 'antigos') {
      const timeA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
      const timeB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
      return timeA - timeB;
    } else {
      const timeA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
      const timeB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
      return timeB - timeA;
    }
  });

  const formatDatePTBR = (dStr: string) => {
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getOperationsString = (sched: Schedule) => {
    const arr = sched.operations || (sched.operation ? (Array.isArray(sched.operation) ? sched.operation : [sched.operation]) : []);
    return arr.join(', ');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <UnifiedHeader
        title="Programações"
        subtitle="Vincule motoristas e veículos as operações."
        totalCount={schedules.length}
        filteredCount={itemsToDisplay.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode as 'grid'|'list'}
        setViewMode={(m) => setViewMode(m as 'grid'|'list')}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOptions={[
          {value: 'recentes', label: 'Mais recentes'},
          {value: 'antigos', label: 'Mais antigos'},
          {value: 'az', label: 'Ordem alfabética (A-Z)'},
          {value: 'za', label: 'Ordem alfabética (Z-A)'}
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
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dashboard Operacional</h2>
          <button
            onClick={() => {
              const rpt = generateReport();
              setReportText(rpt);
              setReportModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            <FileText className="w-4 h-4" /> Gerar Relatório
          </button>
        </div>

        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { id: 'emOperacao', label: 'Motoristas em operação', val: metrics.emOperacao, color: 'blue' },
            { id: 'coletas', label: 'Coletas', val: metrics.coletas, color: 'emerald' },
            { id: 'entregas', label: 'Entregas', val: metrics.entregas, color: 'sky' },
            { id: 'transferencias', label: 'Transferências', val: metrics.transferencias, color: 'indigo' },
            { id: 'manobras', label: 'Manobras', val: metrics.manobras, color: 'violet' },
            { id: 'pendencias', label: 'Pendências', val: metrics.pendencias, color: 'amber' },
            { id: 'folgas', label: 'Folgas/Férias', val: metrics.folgas, color: 'rose' },
            { id: 'semProgramacao', label: 'Sem programação', val: metrics.semProgramacao, color: 'slate' }
          ].map(card => (
            <button
              key={card.id}
              onClick={() => setDashboardFilter(dashboardFilter === card.id ? null : card.id)}
              className={`text-left p-3 rounded-xl border transition-all ${dashboardFilter === card.id ? `bg-${card.color}-50 border-${card.color}-200 dark:bg-${card.color}-900/20 dark:border-${card.color}-800/50 shadow-sm ring-1 ring-${card.color}-500/20` : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-800'}`}
            >
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase line-clamp-2 leading-tight h-8">{card.label}</p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${dashboardFilter === card.id ? `text-${card.color}-700 dark:text-${card.color}-400` : 'text-slate-900 dark:text-white'}`}>{card.val}</p>
            </button>
          ))}
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : itemsToDisplay.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
             <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400">Nenhuma programação encontrada.</p>
          </div>
        ) : viewMode === 'list' ? (
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                    <thead className="bg-slate-50 dark:bg-[#09090B]/50 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                       <tr>
                          <th className="px-4 py-3 text-left">OPERAÇÃO</th>
                          <th className="px-4 py-3 text-left">DATA / HORA</th>
                          <th className="px-4 py-3 text-left">MOTORISTA</th>
                          <th className="px-4 py-3 text-left">VEÍCULO</th>
                          <th className="px-4 py-3 text-left">STATUS</th>
                          <th className="px-5 py-3 text-right">AÇÕES</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                       {itemsToDisplay.map(s => {
                          const drv = drivers.find(d => d.id === s.driverId);
                          const veh = vehicles.find(v => v.id === s.vehicleId);
                          const isEncerrado = s.status === 'Encerrado';
                          return (
                             <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                                   <div className="flex flex-col gap-1">
                                      <span>{getOperationsString(s)}</span>
                                      {s.locationName && (
                                        <span className="text-xs text-slate-500 font-medium normal-case flex items-center gap-1">
                                           <MapPin className="w-3 h-3"/> {s.locationName}
                                        </span>
                                      )}
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-sm">
                                   <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-slate-400" />
                                      {s.date ? formatDatePTBR(s.date) : ''} às {s.time}
                                   </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{drv?.nome || 'N/A'}</td>
                                <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-200">{veh?.placa || 'N/A'}</td>
                                <td className="px-4 py-3">
                                   <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${isEncerrado ? 'bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                                      {s.status}
                                   </span>
                                </td>
                                <td className="px-5 py-3 text-right">
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
            {itemsToDisplay.map(s => {
              const drv = drivers.find(d => d.id === s.driverId);
              const veh = vehicles.find(v => v.id === s.vehicleId);
              const isEncerrado = s.status === 'Encerrado';

              return (
                <div key={s.id} className={`bg-white dark:bg-white/5 border rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500/50 transition flex flex-col ${isEncerrado ? 'border-slate-200 dark:border-white/10 opacity-75' : 'border-blue-200 dark:border-blue-900/50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          {getOperationsString(s)}
                        </span>
                        {s.locationName && (
                          <span className="text-xs text-slate-500 font-medium normal-case flex items-center gap-1">
                             <MapPin className="w-3 h-3"/> {s.locationName}
                          </span>
                        )}
                      </div>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Planejamento Operacional">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motorista</label>
              <div className="relative">
                 <input
                    type="text"
                    required
                    value={driverSearchDisplay}
                    onChange={(e) => {
                       setDriverSearchDisplay(e.target.value);
                       setDriverDropdownOpen(true);
                       const exactMatch = drivers.find(d => d.nome.toLowerCase() === e.target.value.toLowerCase());
                       if (exactMatch) {
                          setDriverId(exactMatch.id!);
                          if (exactMatch.veiculoPadraoId) {
                             setVehicleId(exactMatch.veiculoPadraoId);
                             const v = vehicles.find(vh => vh.id === exactMatch.veiculoPadraoId);
                             if (v) setVehicleSearchDisplay(v.placa);
                          }
                       } else {
                          setDriverId('');
                       }
                    }}
                    onFocus={() => setDriverDropdownOpen(true)}
                    placeholder="Digite o nome..."
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                 />
                 {driverDropdownOpen && driverSearchDisplay.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden flex flex-col">
                       {drivers
                          .filter(d => d.nome.toLowerCase().includes(driverSearchDisplay.toLowerCase()))
                          .slice(0, 2)
                          .map(d => (
                             <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                   setDriverSearchDisplay(d.nome);
                                   setDriverId(d.id!);
                                   setDriverDropdownOpen(false);
                                   if (d.veiculoPadraoId) {
                                      setVehicleId(d.veiculoPadraoId);
                                      const v = vehicles.find(vh => vh.id === d.veiculoPadraoId);
                                      if (v) setVehicleSearchDisplay(v.placa);
                                   }
                                }}
                                className="px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 flex justify-between items-center"
                             >
                                <span>{d.nome}</span>
                                {d.status !== 'Disponível' && editingSchedule?.driverId !== d.id && (
                                  <span className="text-xs text-amber-500 font-medium">({d.status})</span>
                                )}
                             </button>
                          ))}
                       {!drivers.find(d => d.nome.toLowerCase() === driverSearchDisplay.toLowerCase()) && (
                          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5">
                             <button
                                type="button"
                                onClick={() => handleQuickCreateDriver(driverSearchDisplay)}
                                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
                             >
                                Cadastrar motorista "{driverSearchDisplay}"?
                             </button>
                          </div>
                       )}
                       <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-xs text-slate-500 flex justify-end">
                         <button type="button" onClick={() => setDriverDropdownOpen(false)}>Fechar</button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Veículo (Placa)</label>
              <div className="relative">
                 <input
                    type="text"
                    required
                    value={vehicleSearchDisplay}
                    onChange={(e) => {
                       const val = e.target.value.toUpperCase();
                       setVehicleSearchDisplay(val);
                       setVehicleDropdownOpen(true);
                       const exactMatch = vehicles.find(v => v.placa.toUpperCase() === val);
                       if (exactMatch) {
                          setVehicleId(exactMatch.id!);
                       } else {
                          setVehicleId('');
                       }
                    }}
                    onFocus={() => setVehicleDropdownOpen(true)}
                    placeholder="Digite a placa..."
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono uppercase"
                 />
                 {vehicleDropdownOpen && vehicleSearchDisplay.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden flex flex-col">
                       {vehicles
                          .filter(v => v.placa.toUpperCase().includes(vehicleSearchDisplay))
                          .slice(0, 2)
                          .map(v => (
                             <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                   setVehicleSearchDisplay(v.placa);
                                   setVehicleId(v.id!);
                                   setVehicleDropdownOpen(false);
                                }}
                                className="px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-mono flex justify-between items-center"
                             >
                                <span>{v.placa}</span>
                                {v.status !== 'Disponível' && editingSchedule?.vehicleId !== v.id && (
                                  <span className="text-xs text-amber-500 font-medium font-sans">({v.status})</span>
                                )}
                             </button>
                          ))}
                       {!vehicles.find(v => v.placa.toUpperCase() === vehicleSearchDisplay) && (
                          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5">
                             <button
                                type="button"
                                onClick={() => handleQuickCreateVehicle(vehicleSearchDisplay)}
                                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
                             >
                                Cadastrar placa {vehicleSearchDisplay}?
                             </button>
                          </div>
                       )}
                       <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-xs text-slate-500 flex justify-end">
                         <button type="button" onClick={() => setVehicleDropdownOpen(false)}>Fechar</button>
                       </div>
                    </div>
                 )}
              </div>
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

          <div className="grid grid-cols-1 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Operação *</label>
              <div className="flex flex-wrap gap-3">
                {['Coleta', 'Entrega', 'Transferência', 'Viagem', 'Manobra', 'Manutenção'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={op}
                      checked={operations.includes(op)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOperations([...operations, op]);
                        } else {
                          setOperations(operations.filter(o => o !== op));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 select-none">{op}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente / Local</label>
              <div className="relative">
                 <input
                    type="text"
                    value={locationSearchDisplay}
                    onChange={(e) => {
                       setLocationSearchDisplay(e.target.value);
                       setLocationDropdownOpen(true);
                    }}
                    onFocus={() => setLocationDropdownOpen(true)}
                    placeholder="Pesquisar local..."
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                 />
                 {locationDropdownOpen && locationSearchDisplay.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-60 overflow-y-auto">
                       {places
                          .filter(p => (p.nomeFantasia && p.nomeFantasia.toLowerCase().includes(locationSearchDisplay.toLowerCase())) || (p.cidade && p.cidade.toLowerCase().includes(locationSearchDisplay.toLowerCase())))
                          .map(p => (
                             <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                   setLocationSearchDisplay(p.nomeFantasia || p.cidade);
                                   setLocationDropdownOpen(false);
                                }}
                                className="px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 flex flex-col"
                             >
                                <span className="font-medium">{p.nomeFantasia || p.cidade}</span>
                                {p.nomeFantasia && <span className="text-xs text-slate-500">{p.cidade}</span>}
                             </button>
                          ))}
                       <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-xs text-slate-500 flex justify-end">
                         <button type="button" onClick={() => setLocationDropdownOpen(false)}>Fechar</button>
                       </div>
                    </div>
                 )}
              </div>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação Operacional</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
              placeholder="Ex: Retornando ao pátio novo para troca de carreta."
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

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Excluir Programação"
        description="Tem certeza que deseja excluir? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
        confirmText="Excluir"
        isDestructive={true}
      />

      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Relatório Operacional">
        <div className="space-y-4">
          <textarea
            readOnly
            value={reportText}
            className="w-full h-96 p-4 text-xs font-mono bg-slate-900 border border-slate-700 text-slate-100 rounded-lg resize-none outline-none hide-scrollbar leading-relaxed"
          />
          <div className="flex justify-between items-center w-full pt-2">
            <button
              onClick={() => setReportModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition"
            >
              Fechar
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newWin = window.open('', '_blank');
                  if (!newWin) {
                     addToast('Permita popups para exportar o PDF', 'error');
                     return;
                  }
                  newWin.document.write(`
                    <html>
                      <head>
                        <title>Relatório Operacional</title>
                        <style>
                          body { font-family: monospace; white-space: pre-wrap; padding: 40px; font-size: 14px; max-width: 800px; margin: 0 auto; line-height: 1.5; color: #000; }
                          @media print { body { padding: 0; } }
                        </style>
                      </head>
                      <body>${reportText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
                    </html>
                  `);
                  newWin.document.close();
                  newWin.focus();
                  setTimeout(() => newWin.print(), 100);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition"
              >
                📄 Exportar PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reportText);
                  addToast('Copiado para a área de transferência', 'success');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] shadow-sm transition"
              >
                📋 Copiar para WhatsApp
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
