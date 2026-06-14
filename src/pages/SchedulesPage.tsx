import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut, FileText, MapPin, Download, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
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
import { useRoutes } from '../hooks/useRoutes';

import { AboutModal } from '../components/ui/AboutModal';

function exportReportToPDF(
  dateLabel: string,        // ex: "12/06/2026"
  groups: {
    status: string;         // ex: "DISPONÍVEL"
    emoji: string;          // ex: "⚪"
    items: {
      placa: string;
      motorista: string;
      horario: string;
      observacao?: string;
    }[];
  }[],
  notes: {
    placa: string;
    motorista: string;
    categoria: string;
    descricao?: string;
  }[]
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;
  const lineHeight = 6;

  const checkPageBreak = (needed = 10) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // ── CABEÇALHO ──────────────────────────────────────────
  doc.setFillColor(15, 15, 20);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO OPERACIONAL', marginLeft, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text(`Data: ${dateLabel}`, marginLeft, 20);
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    pageWidth - marginRight,
    20,
    { align: 'right' }
  );

  y = 38;

  // ── ANOTAÇÕES OPERACIONAIS (primeiro, se houver) ────────
  if (notes.length > 0) {
    checkPageBreak(14);

    doc.setFillColor(240, 244, 255);
    doc.rect(marginLeft, y - 4, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 60, 120);
    doc.text('ANOTAÇÕES OPERACIONAIS', marginLeft + 2, y + 1);
    y += 8;

    notes.forEach(note => {
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(`${note.placa}  ${note.motorista}`, marginLeft + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`[${note.categoria}]${note.descricao ? '  ' + note.descricao : ''}`, marginLeft + 2, y + 4);
      y += lineHeight + 4;
    });

    y += 4;
  }

  // ── GRUPOS DE STATUS ────────────────────────────────────
  const getColorsForStatus = (status: string) => {
    if (status.startsWith('DISPONÍVEL')) return { bg: [240, 240, 240] as [number, number, number], tx: [80, 80, 80] as [number, number, number] };
    if (status.startsWith('PROGRAMADO')) return { bg: [255, 251, 220] as [number, number, number], tx: [120, 90, 0] as [number, number, number] };
    if (status.startsWith('EM OPERAÇÃO')) return { bg: [220, 235, 255] as [number, number, number], tx: [20, 60, 140] as [number, number, number] };
    if (status.startsWith('CONCLUÍDO')) return { bg: [220, 250, 235] as [number, number, number], tx: [20, 110, 60] as [number, number, number] };
    if (status.startsWith('INDISPONÍVEL')) return { bg: [255, 225, 225] as [number, number, number], tx: [140, 20, 20] as [number, number, number] };
    return { bg: [245, 245, 245] as [number, number, number], tx: [50, 50, 50] as [number, number, number] };
  };

  groups.forEach(group => {
    if (group.items.length === 0) return;

    checkPageBreak(14);

    const colors = getColorsForStatus(group.status);

    doc.setFillColor(...colors.bg);
    doc.rect(marginLeft, y - 4, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.tx);
    doc.text(`${group.emoji}  ${group.status}  (${group.items.length})`, marginLeft + 2, y + 1);
    y += 9;

    group.items.forEach(item => {
      checkPageBreak(8);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(item.placa.padEnd(10), marginLeft + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.motorista}`, marginLeft + 28, y);
      doc.setTextColor(100, 100, 100);
      doc.text(item.horario, pageWidth - marginRight, y, { align: 'right' });
      if (item.observacao) {
        y += 4;
        checkPageBreak(6);
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text(`  ${item.observacao}`, marginLeft + 4, y);
      }
      y += lineHeight;
    });

    y += 4;
  });

  // ── RODAPÉ ──────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Página ${i} de ${pageCount}  •  Transmagna  •  Gerado por Op.Log`,
      pageWidth / 2,
      292,
      { align: 'center' }
    );
  }

  doc.save(`relatorio-operacional-${dateLabel.replace(/\//g, '-')}.pdf`);
}

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
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete'; schedule: Schedule } | null>(null);

  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportPdfData, setReportPdfData] = useState<any>(null);
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

  const [isFixed, setIsFixed] = useState(false);
  const [fixedUntil, setFixedUntil] = useState('');

  const { routes } = useRoutes(user?.uid);
  const [suggestedRoute, setSuggestedRoute] = useState<any | null>(null);
  const [routeBannerVisible, setRouteBannerVisible] = useState(false);

  const checkForSuggestedRoute = (placaToCheck: string) => {
      if (!placaToCheck) {
          setSuggestedRoute(null);
          setRouteBannerVisible(false);
          return;
      }
      const matches = routes.filter(r => 
          (r.placa && r.placa.toUpperCase() === placaToCheck.toUpperCase()) || 
          (r.placa2 && r.placa2.toUpperCase() === placaToCheck.toUpperCase())
      );
      if (matches.length > 0) {
          const sorted = [...matches].sort((a, b) => {
              const timeA = a.createdAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || 0;
              return timeB - timeA;
          });
          setSuggestedRoute(sorted[0]);
          setRouteBannerVisible(true);
      } else {
          setSuggestedRoute(null);
          setRouteBannerVisible(false);
      }
  };

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

  const handleOpenModal = (sched?: Schedule, force: boolean = false) => {
    if (sched) {
      const isDummy = sched.id?.startsWith('drv-');
      if (!force && !isDummy && sched.date && isPastDate(sched.date)) {
        setPendingAction({ type: 'edit', schedule: sched });
        return;
      }
      setEditingSchedule(isDummy ? undefined : sched);
      setDriverId(sched.driverId);
      setVehicleId(sched.vehicleId);
      setDate(isDummy ? selectedDate : sched.date);
      setTime(isDummy ? (sched.time.split(' ')[0] || '08:00') : sched.time);
      
      const opArr = sched.operations || (sched.operation ? (Array.isArray(sched.operation) ? sched.operation : [sched.operation]) : []);
      setOperations(opArr);
      
      setLocationSearchDisplay(sched.locationName || '');
      
      setObservations(sched.observations || '');
      setStatus(isDummy ? 'Ativo' : sched.status);
      
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
    setSuggestedRoute(null);
    setRouteBannerVisible(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const isAdministrative = operations.length > 0 && operations.every(op => ['Folga', 'Férias', 'Afastado', 'Sem Programação', 'Administrativo'].includes(op));
    if (!driverId || (!vehicleId && !isAdministrative) || !date || !time || operations.length === 0 || !status) {
      addToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const newTimeMinutes = parseInt(time.split(':')[0] || '0') * 60 + parseInt(time.split(':')[1] || '0');

    // Validação: Conflito
    const hasConflict = schedules.some(s => {
      if (
        s.id !== editingSchedule?.id && 
        s.status === 'Ativo' && 
        s.date === date && 
        (s.driverId === driverId || (vehicleId && s.vehicleId === vehicleId))
      ) {
        const existingTimeMinutes = parseInt((s.time || '00:00').split(':')[0] || '0') * 60 + parseInt((s.time || '00:00').split(':')[1] || '0');
        const diffInMinutes = Math.abs(existingTimeMinutes - newTimeMinutes);
        return diffInMinutes <= 360; // 6 hours
      }
      return false;
    });

    if (hasConflict) {
      addToast('Conflito: Motorista ou veículo já tem programação neste dia (intervalo menor ou igual a 6h).', 'error');
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

      if (!editingSchedule && isFixed && fixedUntil) {
        const startDt = new Date(date + 'T12:00:00');
        const endDt = new Date(fixedUntil + 'T12:00:00');
        
        if (endDt <= startDt) {
          addToast('Data final deve ser maior que a inicial', 'error');
          setIsBusy(false);
          return;
        }

        const dates: string[] = [];
        const cursor = new Date(startDt);
        while (cursor <= endDt) {
          const dayOfWeek = cursor.getDay();
          // 0 is Sunday, 6 is Saturday
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            dates.push(cursor.toISOString().split('T')[0]);
          }
          cursor.setDate(cursor.getDate() + 1);
        }

        if (dates.length > 90) {
          addToast('Limite de 90 dias excedido', 'error');
          setIsBusy(false);
          return;
        }

        // Verificar conflitos para TODOS os dias antes de criar
        for (const d of dates) {
          const conflict = schedules.some(s => {
            if (s.status === 'Ativo' && s.date === d && (s.driverId === driverId || (vehicleId && s.vehicleId === vehicleId))) {
                const existingTimeMinutes = parseInt((s.time || '00:00').split(':')[0] || '0') * 60 + parseInt((s.time || '00:00').split(':')[1] || '0');
                const diffInMinutes = Math.abs(existingTimeMinutes - newTimeMinutes);
                return diffInMinutes <= 360; // 6 hours
            }
            return false;
          });
          if (conflict) {
            const formattedDate = new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
            addToast(`Conflito na data ${formattedDate} (intervalo <= 6h). Nenhuma programação foi criada.`, 'error');
            setIsBusy(false);
            return;
          }
        }

        const fixedGroupId = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        await Promise.all(dates.map(d =>
          createSchedule({ ...data, date: d, isFixed: true, fixedGroupId })
        ));
        addToast(`${dates.length} programações fixas criadas.`, 'success');
        setIsModalOpen(false);
        loadData();
        setIsBusy(false);
        return;
      }

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

  const handleDeleteGroup = async () => {
    if (!deletingId) return;
    const scheduleToDelete = schedules.find(s => s.id === deletingId);
    if (!scheduleToDelete || !scheduleToDelete.isFixed || !scheduleToDelete.fixedGroupId) {
       return handleDelete();
    }

    setIsBusy(true);
    try {
      const todayString = new Date().toISOString().split('T')[0];
      const groupSchedules = schedules.filter(s => 
        s.fixedGroupId === scheduleToDelete.fixedGroupId && 
        new Date(s.date + 'T12:00:00') >= new Date(todayString + 'T12:00:00')
      );
      
      await Promise.all(groupSchedules.map(async (s) => {
        if (s.id) await deleteSchedule(s.id);
      }));
      
      addToast(`Foram excluídas ${groupSchedules.length} programações do grupo.`, 'success');
      setDeletingId(null);
      loadData();
    } catch(err) {
      addToast('Erro ao excluir grupo', 'error');
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

  const handleRequestDelete = (sched: Schedule, force: boolean = false) => {
    if (!sched.id || sched.id.startsWith('drv-')) return;
    if (!force && sched.date && isPastDate(sched.date)) {
      setPendingAction({ type: 'delete', schedule: sched });
      return;
    }
    setDeletingId(sched.id);
  };

  const isPastDate = (dateStr: string) => {
     return dateStr < todayStr;
  };

  const activeSchedules = schedules.filter(s => s.status === 'Ativo' && s.date === selectedDate);
  
  const metrics = {
    emOperacao: activeSchedules.length,
    coletas: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Coleta')).length,
    entregas: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Entrega')).length,
    transferencias: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Transferência')).length,
    manobras: activeSchedules.filter(s => (s.operations || [s.operation]).includes('Manobra')).length,
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
    let baseItems = schedules.filter(s => s.date === selectedDate);
    return baseItems.filter(s => {
      const drv = drivers.find(d => d.id === s.driverId);
      const veh = vehicles.find(v => v.id === s.vehicleId);
      const opArr = s.operations || (s.operation ? (Array.isArray(s.operation) ? s.operation : [s.operation]) : []);
      const filterText = `${opArr.join(' ')} ${s.status} ${drv?.nome} ${veh?.placa} ${s.date} ${s.locationName || ''}`.toLowerCase();
      return filterText.includes(searchQuery.toLowerCase());
    });
  };

  const generateReport = async (targetDate: string) => {
    const splitDate = targetDate.split('-');
    const formattedDate = `${splitDate[2]}/${splitDate[1]}/${splitDate[0]}`;
    let rpt = `📊 *RELATÓRIO OPERACIONAL | ${formattedDate}*\n\n`;
    const pdfData: any = { dateLabel: formattedDate, groups: [], notes: [] };

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

    // 0. ANOTAÇÕES OPERACIONAIS
    if (user) {
       const isoToday = targetDate;

       const ops = await getOperations(user.uid);
       const todayNotes = ops.filter(o => o.type === 'note' && o.date === isoToday);
       
       if (todayNotes.length > 0) {
         rpt += `──────────────────\n📌 ANOTAÇÕES OPERACIONAIS\n──────────────────\n\n`;
         todayNotes.forEach(o => {
            const getCategoryEmoji = (cat?: string) => {
               if(cat === 'Operacional') return '📝';
               if(cat === 'Programação') return '📅';
               if(cat === 'Manutenção') return '🔧';
               if(cat === 'Cliente') return '🏢';
               return '📌';
            };
            const emoji = getCategoryEmoji(o.category);
            
            let placaVal = o.vehicleRef || o.vehicleId;
            if (o.vehicleId) {
                const v = vehicles.find(vh => vh.id === o.vehicleId);
                if (v) placaVal = v.placa;
            }
            let motoristaVal = o.driverRef || o.driverId;
            if (o.driverId) {
                const d = drivers.find(dr => dr.id === o.driverId);
                if (d) motoristaVal = d.nome;
            }

            const placaStr = placaVal ? `\`[${placaVal.toUpperCase()}]\`` : '';
            const motoristaStr = motoristaVal ? `[${motoristaVal.toUpperCase()}]` : '';
            const descricaoStr = o.description || '';

            const parts = [emoji, placaStr, motoristaStr].filter(Boolean).join(' ');

            rpt += `${parts} — ${descricaoStr}\n\n`;
            pdfData.notes.push({
               placa: placaVal ? placaVal.toUpperCase() : '',
               motorista: motoristaVal ? motoristaVal.toUpperCase() : '',
               categoria: o.category || '',
               descricao: o.description || ''
            });
         });
       }
    }

    // 1. PENDÊNCIAS OPERACIONAIS
    const pended = sortSchedules(activeSchedules.filter(s => s.observations && s.observations.trim().length > 0));
    if (pended.length > 0) {
      rpt += `──────────────────\n🟡 PROGRAMADO\n──────────────────\n\n`;
      const items: any[] = [];
      pended.forEach(s => {
        const placa = getVehiclePlate(s.vehicleId);
        const motorista = getDriverName(s.driverId).toUpperCase();
        const horario = getDriverJornada(s.driverId);
        rpt += `🟡 \`${placa}\` ${motorista} - ${horario} | *${s.observations}*\n\n`;
        items.push({ placa, motorista, horario, observacao: s.observations });
      });
      pdfData.groups.push({ status: 'PROGRAMADO', emoji: '🟡', items });
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
            rpt += `──────────────────\n🔵 EM OPERAÇÃO - ${cli}\n──────────────────\n\n`;
            const items: any[] = [];
            sortSchedules(opsByCli[cli]).forEach(s => {
                const opsStr = (s.operations || [s.operation]).join(', ');
                const local = s.locationName ? s.locationName : '';
                const placa = getVehiclePlate(s.vehicleId);
                const motorista = getDriverName(s.driverId).toUpperCase();
                const obs = opsStr + (local ? ` ${local}` : '');
                rpt += `🔵 \`${placa}\` ${motorista} - ${obs}`.trim() + `\n\n`;
                items.push({ placa, motorista, horario: '', observacao: obs });
            });
            pdfData.groups.push({ status: `EM OPERAÇÃO - ${cli}`, emoji: '🔵', items });
        }
    });

    // 3. COLETAS / ENTREGAS
    if (colEntArr.length > 0) {
        rpt += `──────────────────\n🔵 EM OPERAÇÃO - COLETAS / ENTREGAS\n──────────────────\n\n`;
        const items: any[] = [];
        sortSchedules(colEntArr).forEach(s => {
            const opsStr = (s.operations || [s.operation]).join(', ');
            const local = s.locationName ? s.locationName : '';
            const placa = getVehiclePlate(s.vehicleId);
            const motorista = getDriverName(s.driverId).toUpperCase();
            const obs = opsStr + (local ? ` ${local}` : '');
            rpt += `🔵 \`${placa}\` ${motorista} - ${obs}`.trim() + `\n\n`;
            items.push({ placa, motorista, horario: '', observacao: obs });
        });
        pdfData.groups.push({ status: 'EM OPERAÇÃO', emoji: '🔵', items });
    }

    // 4. REGIÕES (Viagens)
    const tripKeys = Object.keys(tripsByReg).sort();
    tripKeys.forEach(reg => {
       if (tripsByReg[reg].length > 0) {
           rpt += `──────────────────\n🔵 EM OPERAÇÃO - ${reg}\n──────────────────\n\n`;
           const items: any[] = [];
           sortSchedules(tripsByReg[reg]).forEach(s => {
               const placa = getVehiclePlate(s.vehicleId);
               const motorista = getDriverName(s.driverId).toUpperCase();
               const obs = s.locationName ? s.locationName : 'EM VIAGEM';
               rpt += `🔵 \`${placa}\` ${motorista} - ${obs}\n\n`;
               items.push({ placa, motorista, horario: '', observacao: obs });
           });
           pdfData.groups.push({ status: `EM OPERAÇÃO - ${reg}`, emoji: '🔵', items });
       }
    });

    // 5. FOLGA / FÉRIAS / AFASTAMENTOS
    const folgas = sortDriversList(drivers.filter(d => ['Folga', 'Férias', 'Afastado'].includes(d.status)));
    if (folgas.length > 0) {
        rpt += `──────────────────\n🔴 INDISPONÍVEL\n──────────────────\n\n`;
        const items: any[] = [];
        folgas.forEach(d => {
            const placa = getVehiclePlate(d.veiculoPadraoId || '');
            const jorna = `[${d.inicioJornada || '08:00'} às ${d.fimJornada || '18:00'}]`;
            rpt += `🔴 \`${placa}\` ${d.nome.toUpperCase()} - ${jorna} | *${d.status.toUpperCase()}*\n\n`;
            items.push({ placa, motorista: d.nome.toUpperCase(), horario: jorna, observacao: d.status.toUpperCase() });
        });
        pdfData.groups.push({ status: 'INDISPONÍVEL', emoji: '🔴', items });
    }

    // 6. SEM PROGRAMAÇÃO
    const semProg = sortDriversList(drivers.filter(d => 
        !['Folga', 'Férias', 'Afastado'].includes(d.status) &&
        !activeSchedules.some(s => s.driverId === d.id)
    ));
    if (semProg.length > 0) {
        rpt += `──────────────────\n⚪ DISPONÍVEL\n──────────────────\n\n`;
        const items: any[] = [];
        semProg.forEach(d => {
            const placa = getVehiclePlate(d.veiculoPadraoId || '');
            const jorna = `[${d.inicioJornada || '08:00'} às ${d.fimJornada || '18:00'}]`;
            rpt += `⚪ \`${placa}\` ${d.nome.toUpperCase()} - ${jorna}\n\n`;
            items.push({ placa, motorista: d.nome.toUpperCase(), horario: jorna });
        });
        pdfData.groups.push({ status: 'DISPONÍVEL', emoji: '⚪', items });
    }

    return { rpt: rpt.trim() + '\n', pdfData };
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
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-4 py-2 shadow-sm">
            <button
              onClick={() => {
                const d = new Date(`${selectedDate}T12:00:00`);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-full transition font-bold"
            >
              &lt;
            </button>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-medium outline-none cursor-pointer"
              />
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs px-3 py-1 font-medium bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)] rounded-full transition"
              >
                Hoje
              </button>
            </div>
            <button
              onClick={() => {
                const d = new Date(`${selectedDate}T12:00:00`);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-full transition font-bold"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Dashboard Operacional</h2>
          <button
            onClick={async () => {
              setIsBusy(true);
              const { rpt, pdfData } = await generateReport(selectedDate);
              setReportText(rpt);
              setReportPdfData(pdfData);
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
                                      <div className="flex items-center gap-2">
                                         <span>{getOperationsString(s)}</span>
                                         {s.isFixed && <span className="px-1 py-0.5 rounded text-[8px] tracking-widest bg-[#5B8FDB]/10 text-[#5B8FDB] border border-[#5B8FDB]/30 uppercase font-mono">FIXA</span>}
                                      </div>
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
                                   <button onClick={() => handleRequestDelete(s)} className="text-[var(--text-tertiary)] hover:text-[#E05252] transition" title="Excluir">
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
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-[var(--text-primary)] uppercase tracking-tight">
                            {getOperationsString(s)}
                          </span>
                          {s.isFixed && <span className="px-1 py-0.5 rounded text-[8px] tracking-widest bg-[#5B8FDB]/10 text-[#5B8FDB] border border-[#5B8FDB]/30 uppercase font-mono">FIXA</span>}
                        </div>
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
                      onClick={() => handleRequestDelete(s)} 
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
                             if (v) {
                                setVehicleSearchDisplay(v.placa);
                                checkForSuggestedRoute(v.placa);
                             } else {
                                checkForSuggestedRoute('');
                             }
                          } else {
                             checkForSuggestedRoute('');
                          }
                       } else {
                          setDriverId('');
                          checkForSuggestedRoute('');
                       }
                    }}
                    onFocus={() => setDriverDropdownOpen(true)}
                    placeholder="João Francisco de Almeida"
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
                                      if (v) {
                                         setVehicleSearchDisplay(v.placa);
                                         checkForSuggestedRoute(v.placa);
                                      } else {
                                         checkForSuggestedRoute('');
                                      }
                                   } else {
                                      checkForSuggestedRoute('');
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
                    required={!(operations.length > 0 && operations.every(op => ['Folga', 'Férias', 'Afastado', 'Sem Programação', 'Administrativo'].includes(op)))}
                    value={vehicleSearchDisplay}
                    onChange={(e) => {
                       const val = e.target.value.toUpperCase();
                       setVehicleSearchDisplay(val);
                       setVehicleDropdownOpen(true);
                       const exactMatch = vehicles.find(v => v.placa.toUpperCase() === val);
                       if (exactMatch) {
                          setVehicleId(exactMatch.id!);
                          checkForSuggestedRoute(exactMatch.placa);
                       } else {
                          setVehicleId('');
                          checkForSuggestedRoute('');
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
                                   checkForSuggestedRoute(v.placa);
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

          {routeBannerVisible && suggestedRoute && (
            <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-md text-sm md:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    <span>📍 Roteiro encontrado para esta placa</span>
                  </div>
                  <div className="mt-1 text-blue-800/80">
                    Destinos: {suggestedRoute.destinos?.map((d: any) => d.nomeFantasia || d.cidade || 'Endereço').join(' → ')}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                      const firstStop = suggestedRoute.destinos?.[0];
                      if (firstStop) {
                          setLocationSearchDisplay(firstStop.nomeFantasia || firstStop.cidade || '');
                          if (firstStop.operacao) {
                              if (!operations.includes(firstStop.operacao)) {
                                  setOperations([...operations, firstStop.operacao]);
                              }
                          }
                      }
                      setRouteBannerVisible(false);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                >
                  Usar este roteiro
                </button>
                <button
                  type="button"
                  onClick={() => setRouteBannerVisible(false)}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-medium transition"
                >
                  Ignorar
                </button>
              </div>
            </div>
          )}

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
                {['Coleta', 'Entrega', 'Transferência', 'Viagem', 'Manobra', 'Manutenção', 'Folga', 'Férias', 'Afastado', 'Sem Programação'].map(op => (
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
                    placeholder="Centro de Estética Autoprime"
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
              placeholder="Ex: retornando ao pátio novo para troca de carreta."
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent)] font-mono text-sm tracking-tight"
            />
          </div>

          {!editingSchedule && (
            <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-base)] space-y-3">
               <div className="flex items-center justify-between">
                 <p className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Programação Fixa</p>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFixed}
                      onChange={e => {
                        setIsFixed(e.target.checked);
                        if (!e.target.checked) setFixedUntil('');
                      }}
                      className="hidden"
                    />
                    <div className={`w-8 h-4 rounded-full transition-colors ${isFixed ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface)] border border-[var(--border)]'} relative`}>
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${isFixed ? 'left-4' : 'left-0.5 bg-[var(--text-tertiary)]'}`} />
                    </div>
                 </label>
               </div>
               
               {isFixed && (
                 <div className="pt-2 border-t border-[var(--border)] space-y-3">
                   <div>
                     <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Repetir até</label>
                     <input
                       type="date"
                       required={isFixed}
                       value={fixedUntil}
                       onChange={e => setFixedUntil(e.target.value)}
                       className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
                     />
                   </div>
                   <p className="text-xs text-[var(--text-secondary)] italic">
                     ℹ️ Serão criadas programações individuais para cada dia do período selecionado (máximo 90 dias).
                   </p>
                   {fixedUntil && new Date(fixedUntil + 'T12:00:00') >= new Date(date + 'T12:00:00') && (
                     <div className="text-xs bg-[#D4A843]/10 text-[#D4A843] px-3 py-2 rounded border border-[#D4A843]/30">
                       <span className="font-semibold">Prévia: </span> Serão criadas {Math.min(90, Math.floor((new Date(fixedUntil + 'T12:00:00').getTime() - new Date(date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1)} programações.
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}

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
        title={schedules.find(s => s.id === deletingId)?.isFixed ? "Excluir Programação Fixa" : "Excluir Programação"}
        description={schedules.find(s => s.id === deletingId)?.isFixed ? "Tem certeza que deseja excluir? Esta programação faz parte de um grupo recorrente." : "Tem certeza que deseja excluir? Esta ação não pode ser desfeita."}
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
        confirmText={schedules.find(s => s.id === deletingId)?.isFixed ? "Apenas esta" : "Excluir"}
        isDestructive={true}
        secondaryAction={
          schedules.find(s => s.id === deletingId)?.isFixed ? {
            label: "Excluir grupo (futuras)",
            onClick: handleDeleteGroup
          } : undefined
        }
      />

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction?.type === 'edit' ? "Editar programação passada" : "Excluir programação passada"}
        description={`Esta programação é de uma data anterior (${pendingAction?.schedule?.date}). ${pendingAction?.type === 'edit' ? 'Editar' : 'Excluir'} pode afetar relatórios já gerados. Deseja continuar?`}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === 'edit') {
            handleOpenModal(pendingAction.schedule, true);
          } else {
            handleRequestDelete(pendingAction.schedule, true);
          }
          setPendingAction(null);
        }}
        onClose={() => setPendingAction(null)}
        confirmText={pendingAction?.type === 'edit' ? "Editar mesmo assim" : "Excluir mesmo assim"}
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
                onClick={() => exportReportToPDF(reportPdfData.dateLabel, reportPdfData.groups, reportPdfData.notes)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
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
