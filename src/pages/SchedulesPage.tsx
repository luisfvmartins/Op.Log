import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut, FileText, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, Schedule } from '../services/schedules';
import { getDrivers, updateDriver, createDriver, Driver } from '../services/drivers';
import { getVehicles, updateVehicle, createVehicle, Vehicle } from '../services/vehicles';
import { getOperations } from '../services/operations';
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

  const generateReport = async () => {
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

    // 7. ANOTAÇÕES DO DIA
    if (user) {
       const dt = new Date();
       const yyyy = dt.getFullYear();
       const mm = String(dt.getMonth() + 1).padStart(2, '0');
       const dd = String(dt.getDate()).padStart(2, '0');
       const isoToday = `${yyyy}-${mm}-${dd}`;

       const ops = await getOperations(user.uid);
       const todayNotes = ops.filter(o => o.type === 'note' && o.date === isoToday);
       
       if (todayNotes.length > 0) {
         rpt += `──────────────────\n📋 ANOTAÇÕES DO DIA\n──────────────────\n\n`;
         todayNotes.forEach(o => {
            const vehPart = o.vehicleRef || o.vehicleId ? o.vehicleRef || o.vehicleId : 'S/ PLACA';
            const catPart = o.category || 'Operacional';
            const driverPart = o.driverRef || o.driverId ? `\n  Motorista: ${o.driverRef || o.driverId}` : '';
            rpt += `- ${vehPart} — [${catPart}]\n  ${o.description || ''}${driverPart}\n\n`;
         });
       }
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
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
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
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Dashboard Operacional</h2>
          <button
            onClick={async () => {
              setIsBusy(true);
              const rpt = await generateReport();
              setReportText(rpt);
              setReportModalOpen(true);
              setIsBusy(false);
            }}
            disabled={isBusy}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-[#0C0D0F] text-sm font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> {isBusy ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>

        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { id: 'emOperacao', label: 'Motoristas em operação', val: metrics.emOperacao, style: 'bg-[var(--accent-tint)] border-[var(--accent-border)] font-semibold text-[var(--accent)]' },
            { id: 'coletas', label: 'Coletas', val: metrics.coletas, style: 'bg-[var(--bg-surface)] border-[var(--border)] font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)]' },
            { id: 'entregas', label: 'Entregas', val: metrics.entregas, style: 'bg-[var(--bg-surface)] border-[var(--border)] font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)]' },
            { id: 'transferencias', label: 'Transferências', val: metrics.transferencias, style: 'bg-[var(--bg-surface)] border-[var(--border)] font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)]' },
            { id: 'manobras', label: 'Manobras', val: metrics.manobras, style: 'bg-[var(--bg-surface)] border-[var(--border)] font-semibold text-[var(--text-primary)] hover:border-[var(--border-hover)]' },
            { id: 'pendencias', label: 'Pendências', val: metrics.pendencias, style: 'bg-[#E0BC6A]/10 border-[#E0BC6A]/30 font-semibold text-[#E0BC6A]' },
            { id: 'folgas', label: 'Folgas/Férias', val: metrics.folgas, style: 'bg-[#5B8FDB]/10 border-[#5B8FDB]/30 font-semibold text-[#5B8FDB]' },
            { id: 'semProgramacao', label: 'Sem programação', val: metrics.semProgramacao, style: 'bg-[#4CAF7D]/10 border-[#4CAF7D]/30 font-semibold text-[#4CAF7D]' }
          ].map(card => (
            <button
              key={card.id}
              onClick={() => setDashboardFilter(dashboardFilter === card.id ? null : card.id)}
              className={`text-left p-3 rounded-xl border transition-all ${dashboardFilter === card.id ? card.style.replace('bg-[var(--bg-surface)]', 'bg-[var(--accent-tint)]').replace('border-[var(--border)]', 'border-[var(--accent-border)]') : card.style}`}
            >
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest line-clamp-2 leading-tight h-8">{card.label}</p>
              <p className={`text-xl sm:text-2xl font-mono mt-1 ${dashboardFilter === card.id ? 'text-[var(--accent)]' : card.style.match(/text-\[[^\]]+\]/)?.[0] || 'text-[var(--text-primary)]'}`}>{card.val}</p>
            </button>
          ))}
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent" /></div>
        ) : itemsToDisplay.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
             <Calendar className="w-12 h-12 text-[var(--border)] mx-auto mb-3" />
             <p className="text-[var(--text-secondary)]">Nenhuma programação encontrada.</p>
          </div>
        ) : viewMode === 'list' ? (
           <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                    <thead className="bg-transparent border-b border-[var(--border)]">
                       <tr>
                          <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">OPERAÇÃO</th>
                          <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">DATA / HORA</th>
                          <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">MOTORISTA</th>
                          <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">VEÍCULO</th>
                          <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">STATUS</th>
                          <th className="px-5 py-3 pr-6 w-32 text-right text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">AÇÕES</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                       {itemsToDisplay.map(s => {
                          const drv = drivers.find(d => d.id === s.driverId);
                          const veh = vehicles.find(v => v.id === s.vehicleId);
                          const isEncerrado = s.status === 'Encerrado';
                          return (
                             <tr key={s.id} className="hover:bg-[var(--bg-base)] transition">
                                <td className="px-4 py-3 font-semibold text-[var(--text-primary)] uppercase">
                                   <div className="flex flex-col gap-1">
                                      <span>{getOperationsString(s)}</span>
                                      {s.locationName && (
                                        <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
                                           {s.locationName}
                                        </span>
                                      )}
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-[var(--text-secondary)] font-mono">
                                   <div className="flex items-center gap-2">
                                      <Clock className="w-[14px] h-[14px] text-[var(--text-tertiary)]" />
                                      {s.date ? formatDatePTBR(s.date) : ''} às {s.time}
                                   </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{drv?.nome || 'N/A'}</td>
                                <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{veh?.placa || 'N/A'}</td>
                                <td className="px-4 py-3">
                                   <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border ${isEncerrado ? 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)]' : 'bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--accent-border)]'}`}>
                                      {s.status}
                                   </span>
                                </td>
                                <td className="px-5 py-3 pr-6 text-right">
       <div className="flex items-center justify-end gap-3">
         <button onClick={() => handleOpenModal(s)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition" title="Editar">
                                      <Edit2 className="w-[14px] h-[14px]"/>
                                   </button>
                                   {!isEncerrado && (
                                      <button onClick={() => handleComplete(s)} className="text-[var(--text-tertiary)] hover:text-[#4CAF7D] transition" title="Encerrar">
                                         <CheckCircle className="w-[14px] h-[14px]" />
                                      </button>
                                   )}
                                   <button onClick={() => setDeletingId(s.id!)} className="text-[var(--text-tertiary)] hover:text-[#E05252] transition" title="Excluir">
                                      <Trash2 className="w-[14px] h-[14px]" />
                                   </button>
                                
       </div>
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
                <div key={s.id} className={`bg-[var(--bg-surface)] border rounded-xl overflow-hidden flex flex-col transition-all min-h-[220px] ${isEncerrado ? 'border-[var(--border)] opacity-75' : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'}`}>
                  <div className="p-5 flex-1 flex flex-col relative">
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-1.5 py-0.5 mt-1 rounded text-[10px] uppercase font-mono border ${isEncerrado ? 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)]' : 'bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--accent-border)]'}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pr-16 mb-4">
                        <span className="text-base font-semibold text-[var(--text-primary)] uppercase tracking-tight">
                          {getOperationsString(s)}
                        </span>
                        {s.locationName && (
                          <span className="text-xs font-mono text-[var(--text-tertiary)] flex items-center gap-1">
                             {s.locationName}
                          </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        <span className="font-medium">{s.date ? formatDatePTBR(s.date) : ''} às {s.time}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">Motorista</p>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{drv?.nome || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">Veículo</p>
                          <p className="text-sm font-mono text-[var(--text-primary)]">{veh?.placa || 'N/A'}</p>
                        </div>
                      </div>

                      {s.observations && (
                        <div className="pt-3 border-t border-[var(--border)] flex-1">
                          <p className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Obs</p>
                          <p className="text-xs font-mono text-[var(--text-secondary)] line-clamp-2">{s.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-base)] flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleOpenModal(s)} 
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                      title="Editar"
                    >
                      <Edit2 className="w-[14px] h-[14px]" />
                    </button>
                    {!isEncerrado && (
                      <button 
                        onClick={() => handleComplete(s)} 
                        className="text-[var(--text-tertiary)] hover:text-[#4CAF7D] transition"
                        title="Encerrar e Liberar Motorista/Veículo"
                      >
                        <CheckCircle className="w-[14px] h-[14px]" />
                      </button>
                    )}
                    <button 
                      onClick={() => setDeletingId(s.id!)} 
                      className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
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
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Motorista</label>
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
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                 />
                 {driverDropdownOpen && driverSearchDisplay.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
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
                                className="px-4 py-2 text-left text-sm hover:bg-[var(--bg-base)] text-[var(--text-primary)] flex justify-between items-center border-b border-[var(--border)] last:border-0"
                             >
                                <span className="font-semibold">{d.nome}</span>
                                {d.status !== 'Disponível' && editingSchedule?.driverId !== d.id && (
                                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#E0BC6A]">({d.status})</span>
                                )}
                             </button>
                          ))}
                       {!drivers.find(d => d.nome.toLowerCase() === driverSearchDisplay.toLowerCase()) && (
                          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-base)]">
                             <button
                                type="button"
                                onClick={() => handleQuickCreateDriver(driverSearchDisplay)}
                                className="text-xs font-semibold text-[var(--text-primary)] hover:underline"
                             >
                                Cadastrar motorista "{driverSearchDisplay}"?
                             </button>
                          </div>
                       )}
                       <div className="px-4 py-2 bg-[var(--bg-base)] text-xs text-[var(--text-tertiary)] flex justify-end border-t border-[var(--border)]">
                         <button type="button" className="hover:text-[var(--text-primary)]" onClick={() => setDriverDropdownOpen(false)}>Fechar</button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Veículo (Placa)</label>
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
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono uppercase focus:outline-none focus:border-[var(--accent)] tracking-widest"
                 />
                 {vehicleDropdownOpen && vehicleSearchDisplay.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
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
                                className="px-4 py-2 text-left text-sm hover:bg-[var(--bg-base)] text-[var(--text-primary)] font-mono flex justify-between items-center border-b border-[var(--border)] last:border-0"
                             >
                                <span>{v.placa}</span>
                                {v.status !== 'Disponível' && editingSchedule?.vehicleId !== v.id && (
                                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#E0BC6A]">({v.status})</span>
                                )}
                             </button>
                          ))}
                       {!vehicles.find(v => v.placa.toUpperCase() === vehicleSearchDisplay) && (
                          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-base)]">
                             <button
                                type="button"
                                onClick={() => handleQuickCreateVehicle(vehicleSearchDisplay)}
                                className="text-xs font-semibold text-[var(--text-primary)] hover:underline"
                             >
                                Cadastrar placa {vehicleSearchDisplay}?
                             </button>
                          </div>
                       )}
                       <div className="px-4 py-2 bg-[var(--bg-base)] text-xs text-[var(--text-tertiary)] flex justify-end border-t border-[var(--border)]">
                         <button type="button" className="hover:text-[var(--text-primary)]" onClick={() => setVehicleDropdownOpen(false)}>Fechar</button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Horário</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-2">Tipo de Operação *</label>
              <div className="flex flex-wrap gap-3">
                {['Coleta', 'Entrega', 'Transferência', 'Viagem', 'Manobra', 'Manutenção'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer group">
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
                       className="w-4 h-4 text-[var(--accent)] bg-[var(--bg-base)] border-[var(--border)] rounded focus:ring-[var(--accent)] focus:ring-offset-[var(--bg-surface)] cursor-pointer"
                    />
                    <span className="text-sm text-[var(--text-primary)] select-none group-hover:text-[var(--accent)] transition-colors">{op}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Cliente / Local</label>
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
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] tracking-tight"
                 />
                 {locationDropdownOpen && locationSearchDisplay.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-60 overflow-y-auto">
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
                                className="px-4 py-2 text-left text-sm hover:bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col border-b border-[var(--border)] last:border-0"
                             >
                                <span className="font-semibold">{p.nomeFantasia || p.cidade}</span>
                                {p.nomeFantasia && <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">{p.cidade}</span>}
                             </button>
                          ))}
                       <div className="px-4 py-2 bg-[var(--bg-base)] text-xs text-[var(--text-tertiary)] flex justify-end border-t border-[var(--border)] flex-shrink-0">
                         <button type="button" className="hover:text-[var(--text-primary)]" onClick={() => setLocationDropdownOpen(false)}>Fechar</button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="Ativo">Ativo</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Observação Operacional</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
              placeholder="Ex: Retornando ao pátio novo para troca de carreta."
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono text-sm tracking-tight"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-md transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-[#0C0D0F] hover:bg-[var(--accent-hover)] rounded-md transition disabled:opacity-50"
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
            className="w-full h-96 p-4 text-xs font-mono bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] rounded-md resize-none outline-none focus:border-[var(--accent)] hide-scrollbar leading-relaxed"
          />
          <div className="flex justify-between items-center w-full pt-2">
            <button
              onClick={() => setReportModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-md transition"
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] rounded-md hover:border-[var(--border-hover)] transition"
              >
                📄 Exportar PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reportText);
                  addToast('Copiado para a área de transferência', 'success');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#4CAF7D] text-[#0C0D0F] rounded-md hover:bg-[#4CAF7D]/90 shadow-sm transition"
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
