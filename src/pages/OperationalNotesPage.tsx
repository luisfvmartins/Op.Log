import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOperations, createOperation, updateOperation, deleteOperation, OperationLog } from '../services/operations';
import { getDrivers, Driver } from '../services/drivers';
import { getVehicles, Vehicle } from '../services/vehicles';
import { getSchedules, Schedule, updateSchedule } from '../services/schedules';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BookOpen, Calendar, CheckCircle, Clock, Edit2, Plus, Search, Trash2, Pin, Tag, Flag, AlertTriangle, UserX, PenTool, CheckCircle2, Truck, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut } from 'lucide-react';
import { UnifiedHeader } from '../components/UnifiedHeader';
import { useViewPrefs } from '../hooks/useViewPrefs';

import { AboutModal } from '../components/ui/AboutModal';

export function OperationalNotesPage({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
  const [dbOperations, setDbOperations] = useState<OperationLog[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const { viewMode, setViewMode, sortBy, setSortBy } = useViewPrefs('notes', 'grid', 'recentes');
  const [activeTab, setActiveTab] = useState<'Anotações' | 'Tarefas'>('Anotações');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<OperationLog | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete'; op: OperationLog } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [pdfReportText, setPdfReportText] = useState('');

  // Form
  const [type, setType] = useState<'note' | 'task'>('note');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operacional');
  const [priority, setPriority] = useState('Baixa');
  const [status, setStatus] = useState('Pendente');
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [driverText, setDriverText] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user) {
         const [ops, drvs, vehs, scheds] = await Promise.all([
            getOperations(user.uid),
            getDrivers(user.uid),
            getVehicles(user.uid),
            getSchedules(user.uid)
         ]);
         setDbOperations(ops);
         setDrivers(drvs);
         setVehicles(vehs);
         setSchedules(scheds);
      }
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPastDate = (dateStr: string) => {
     return dateStr < todayStr;
  };

  const handleOpenModal = (op?: OperationLog, force = false) => {
    if (op) {
      if (!force && op.date && isPastDate(op.date)) {
        setPendingAction({ type: 'edit', op });
        return;
      }
      setEditingOp(op);
      setType(op.type as 'note' | 'task');
      setDescription(op.description || '');
      setCategory(op.category || 'Operacional');
      setPriority(op.priority || 'Baixa');
      setStatus(op.status || 'Pendente');
      setDueDate(op.date || '');
      setTime(op.time || '');
      setChecklistItems(op.checklistItems || []);
      setDriverText(
        op.driverRef ||
        (op.driverId ? drivers.find(d => d.id === op.driverId)?.nome || op.driverId : '')
      );
      setVehicleText(
        op.vehicleRef ||
        (op.vehicleId ? vehicles.find(v => v.id === op.vehicleId)?.placa || op.vehicleId : '')
      );
      setIsPinned(op.isPinned || false);
    } else {
      setEditingOp(undefined);
      setType(activeTab === 'Tarefas' ? 'task' : 'note');
      setDescription('');
      setCategory('Operacional');
      setPriority('Baixa');
      setStatus('Pendente');
      setDueDate(selectedDate);
      setTime('');
      setChecklistItems([]);
      setDriverText('');
      setVehicleText('');
      setIsPinned(false);
    }
    setIsModalOpen(true);
  };

  const handleRequestDelete = (op: OperationLog, force = false) => {
    if (!force && op.date && isPastDate(op.date)) {
      setPendingAction({ type: 'delete', op });
      return;
    }
    setDeletingId(op.id!);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!dueDate) {
      addToast('A data é obrigatória', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const data: any = {
        userId: user.uid,
        type,
        description: description.trim(),
        category,
        priority,
        status: type === 'task' ? status : '',
        date: dueDate,
        time: time || undefined,
        driverRef: driverText.trim(),
        vehicleRef: vehicleText.trim(),
        isPinned,
        checklistItems: type === 'task' ? checklistItems : []
      };
      
      // Remove any remaining undefined values just in case
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

      if (editingOp?.id) {
        if (editingOp.id.startsWith('sched-')) {
          await updateSchedule(editingOp.id.replace('sched-', ''), { observations: data.description });
          addToast('Anotação de programação atualizada', 'success');
        } else {
          await updateOperation(editingOp.id, data);
          addToast('Registro atualizado', 'success');
        }
      } else {
        await createOperation(data);
        addToast('Registro criado', 'success');
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
      await deleteOperation(deletingId);
      addToast('Registro excluído', 'success');
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCompleteTask = async (task: OperationLog) => {
    try {
      await updateOperation(task.id!, { status: task.status === 'Concluída' ? 'Pendente' : 'Concluída' });
      loadData();
    } catch (err) {
      addToast('Erro ao atualizar status', 'error');
    }
  };

  const handleTogglePin = async (note: OperationLog) => {
    try {
      await updateOperation(note.id!, { isPinned: !note.isPinned });
      loadData();
    } catch (err) {
      addToast('Erro ao fixar/desafixar', 'error');
    }
  };

  const getOpDisplayTitle = (op: OperationLog) => {
     const joined = [op.vehicleRef || op.vehicleId, op.driverRef || op.driverId].filter(Boolean).join(' · ');
     if (joined) return joined;
     if (op.category) return op.category;
     if (op.date) {
        const [y, m, d] = op.date.split('-');
        return `${d}/${m}/${y}`;
     }
     return 'Anotação';
  };

  const getCategoryEmoji = (category?: string) => {
      switch (category) {
          case 'Operacional': return '📝';
          case 'Programação': return '📅';
          case 'Manutenção': return '🔧';
          case 'Cliente': return '🏢';
          case 'Extra': return '📝';
          default: return '📌';
      }
  };

  const scheduleNotes: OperationLog[] = schedules
    .filter(s => s.observations && s.observations.trim().length > 0)
    .map(s => {
      const v = vehicles.find(vh => vh.id === s.vehicleId);
      const d = drivers.find(dr => dr.id === s.driverId);
      return {
        id: `sched-${s.id}`,
        userId: s.userId,
        type: 'note',
        date: s.date,
        time: s.time,
        category: 'Programação',
        description: s.observations,
        driverId: s.driverId,
        vehicleId: s.vehicleId,
        driverRef: d?.nome,
        vehicleRef: v?.placa,
        status: 'Aberta',
        isPinned: false
      } as OperationLog;
    });

  const operations = [...dbOperations, ...scheduleNotes];

  const generateReport = () => {
    const splitDate = selectedDate.split('-');
    const formattedDate = `${splitDate[2]}/${splitDate[1]}/${splitDate[0]}`;
    let whatsappText = `📊 *RELATÓRIO OPERACIONAL | ${formattedDate}*\n\n`;
    let pdfText = `RELATÓRIO OPERACIONAL | ${formattedDate}\n\n`;
    
    // Anotações
    const dateNotes = operations.filter(o => o.type === 'note' && o.date === selectedDate);
    if (dateNotes.length > 0) {
      whatsappText += `📌 *ANOTAÇÕES*\n`;
      pdfText += `ANOTAÇÕES\n`;
      dateNotes.forEach(note => {
        const vText = note.vehicleRef || (note.vehicleId ? vehicles.find(v => v.id === note.vehicleId)?.placa : '');
        const dText = note.driverRef || (note.driverId ? drivers.find(d => d.id === note.driverId)?.nome : '');
        const emoji = getCategoryEmoji(note.category);
        
        const placaStr = vText ? `\`${vText.toUpperCase()}\`` : '';
        const motoristaStr = dText ? `${dText.toUpperCase()}` : '';

        const whatsappParts = [emoji, placaStr, motoristaStr].filter(Boolean).join(' ');
        const pdfParts = [vText ? vText.toUpperCase() : '', dText ? dText.toUpperCase() : ''].filter(Boolean).join(' ');

        whatsappText += `${whatsappParts} — ${note.description}\n`;
        // Remove known emojis from description just in case it breaks jsPDF
        const safeDescription = (note.description || '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
        pdfText += `${pdfParts ? pdfParts + ' — ' : ''}${safeDescription}\n`;
      });
      whatsappText += `\n`;
      pdfText += `\n`;
    }

    // Tarefas
    const dateTasks = operations.filter(o => o.type === 'task' && o.date === selectedDate);
    if (dateTasks.length > 0) {
      whatsappText += `📋 *TAREFAS*\n`;
      pdfText += `TAREFAS\n`;
      dateTasks.forEach(task => {
        whatsappText += `• *${task.priority}* ${task.category} — ${task.description} (${task.status})\n`;
        const safeTaskDesc = (task.description || '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
        pdfText += `- ${task.priority} | ${task.category} - ${safeTaskDesc} (${task.status})\n`;
      });
    }
    
    setReportText(whatsappText.trim());
    setPdfReportText(pdfText.trim());
    setReportModalOpen(true);
  };

  const getFilteredItems = () => {
    let list = operations;

    if (dashboardFilter === 'anotacoes') list = list.filter(o => o.type === 'note' && o.date === selectedDate);
    else if (dashboardFilter === 'fixadas') list = list.filter(o => o.type === 'note' && o.isPinned);
    else if (dashboardFilter === 'tarefas') list = list.filter(o => o.type === 'task');
    else if (dashboardFilter === 'tarefasDia') list = list.filter(o => o.type === 'task' && o.date === selectedDate);
    else if (dashboardFilter === 'tarefasPendentes') list = list.filter(o => o.type === 'task' && o.status !== 'Concluída');
    else if (dashboardFilter === 'tarefasConcluidas') list = list.filter(o => o.type === 'task' && o.status === 'Concluída');
    else {
      list = list.filter(o => o.date === selectedDate);
    }

    return list.filter(op => {
      const filterText = `${getOpDisplayTitle(op)} ${op.description || ''} ${op.category || ''}`.toLowerCase();
      const typeMatch = (activeTab === 'Anotações' && op.type === 'note') || (activeTab === 'Tarefas' && op.type === 'task');
      return filterText.includes(searchQuery.toLowerCase()) && (dashboardFilter ? true : typeMatch);
    });
  };

  const filteredOps = getFilteredItems().sort((a, b) => {
    if (sortBy === 'az') {
      return getOpDisplayTitle(a).localeCompare(getOpDisplayTitle(b));
    } else if (sortBy === 'za') {
      return getOpDisplayTitle(b).localeCompare(getOpDisplayTitle(a));
    } else if (sortBy === 'antigos') {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeA - timeB;
    } else {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    }
  });

  const pinnedNotes = filteredOps.filter(o => o.isPinned);
  const otherNotes = filteredOps.filter(o => !o.isPinned);

  const getPriorityColor = (p: string) => {
    if (p === 'Alta' || p === 'Crítica') return 'text-red-500 bg-red-50 dark:bg-red-500/10';
    if (p === 'Média') return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10';
    return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
  };

  const handleCardClick = (filter: string, tab: 'Anotações' | 'Tarefas') => {
    if (dashboardFilter === filter) {
      setDashboardFilter(null);
    } else {
      setDashboardFilter(filter);
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-full pb-24 font-sans">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <UnifiedHeader
        title="Anotações Operacionais"
        subtitle="Diário logístico, tarefas e planejamento do próximo dia."
        totalCount={operations.length}
        filteredCount={filteredOps.length}
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
        buttonText="Novo Registro"
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setAboutModalOpen={setIsAboutModalOpen}
        searchPlaceholder="Buscar registros..."
      />

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* Date Selector & Report */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full md:w-auto flex justify-center">
            <div className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-full px-4 py-2 shadow-sm">
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
              <div className="text-sm font-mono tracking-widest text-[var(--text-primary)] uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent)]" /> {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
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
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] transition"
          >
            <BookOpen className="w-4 h-4" /> Relatório Operacional
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[var(--bg-surface)] border border-[var(--border)] p-1 rounded-md w-fit">
          {(['Anotações', 'Tarefas'] as const).map(tab => (
            <button
               key={tab}
               onClick={() => { setActiveTab(tab); setDashboardFilter(null); }}
               className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  activeTab === tab 
                     ? 'bg-[var(--accent-tint)] text-[var(--text-primary)] border border-[var(--accent-border)]' 
                     : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
               }`}
            >
               {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div onClick={() => handleCardClick('anotacoes', 'Anotações')} className={`cursor-pointer transition-all border rounded-xl p-4 ${dashboardFilter === 'anotacoes' ? 'bg-[var(--accent-tint)] border-[var(--accent)] shadow-sm' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Total de Anotações</p>
            <p className="text-2xl font-mono text-[var(--text-primary)] mt-1">
              {operations.filter(o => o.type === 'note' && o.date === selectedDate).length}
            </p>
          </div>
          <div onClick={() => handleCardClick('fixadas', 'Anotações')} className={`cursor-pointer transition-all border rounded-xl p-4 ${dashboardFilter === 'fixadas' ? 'bg-[#D4A843]/10 border-[#D4A843]/30 shadow-sm' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Anotações Fixadas</p>
            <p className="text-2xl font-mono text-[#D4A843] mt-1">
              {operations.filter(o => o.type === 'note' && o.isPinned).length}
            </p>
          </div>
          <div onClick={() => handleCardClick('tarefas', 'Tarefas')} className={`cursor-pointer transition-all border rounded-xl p-4 ${dashboardFilter === 'tarefas' ? 'bg-[#5B8FDB]/10 border-[#5B8FDB]/30 shadow-sm' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Total de Tarefas</p>
            <p className="text-2xl font-mono text-[var(--text-primary)] mt-1">
              {operations.filter(o => o.type === 'task').length}
            </p>
          </div>
          <div onClick={() => handleCardClick('tarefasDia', 'Tarefas')} className={`cursor-pointer transition-all border rounded-xl p-4 ${dashboardFilter === 'tarefasDia' ? 'bg-[#5B8FDB]/10 border-[#5B8FDB]/30 shadow-sm' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Tarefas do Dia</p>
            <p className="text-2xl font-mono text-[#5B8FDB] mt-1">
              {operations.filter(o => o.type === 'task' && o.date === selectedDate).length}
            </p>
          </div>
          <div onClick={() => handleCardClick('tarefasPendentes', 'Tarefas')} className={`cursor-pointer transition-all border rounded-xl p-4 ${dashboardFilter === 'tarefasPendentes' ? 'bg-[#E0BC6A]/10 border-[#E0BC6A]/30 shadow-sm' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Tarefas Pendentes</p>
            <p className="text-2xl font-mono text-[#E0BC6A] mt-1">
              {operations.filter(o => o.type === 'task' && o.status !== 'Concluída').length}
            </p>
          </div>
          <div onClick={() => handleCardClick('tarefasConcluidas', 'Tarefas')} className={`cursor-pointer transition-all border rounded-xl p-4 ${dashboardFilter === 'tarefasConcluidas' ? 'bg-[#4CAF7D]/10 border-[#4CAF7D]/30 shadow-sm' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">Tarefas Concluídas</p>
            <p className="text-2xl font-mono text-[#4CAF7D] mt-1">
              {operations.filter(o => o.type === 'task' && o.status === 'Concluída').length}
            </p>
          </div>
        </div>

        {/* Content based on Tab */}
        {activeTab === 'Anotações' && (
           <div className="space-y-6">
             {pinnedNotes.length > 0 && (
                <div>
                   <h3 className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-widest mb-3">Fixadas</h3>
                   <div className={viewMode === 'list' ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                      {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onEdit={() => handleOpenModal(note)} onDelete={() => setDeletingId(note.id!)} onTogglePin={() => handleTogglePin(note)} viewMode={viewMode} />)}
                   </div>
                </div>
             )}
             <div>
                {pinnedNotes.length > 0 && <h3 className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest mb-3 mt-8">Outras</h3>}
                {otherNotes.length > 0 ? (
                   <div className={viewMode === 'list' ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                      {otherNotes.map(note => <NoteCard key={note.id} note={note} onEdit={() => handleOpenModal(note)} onDelete={() => setDeletingId(note.id!)} onTogglePin={() => handleTogglePin(note)} viewMode={viewMode} />)}
                   </div>
                ) : (
                   !pinnedNotes.length && (
                      <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
                         <BookOpen className="w-12 h-12 text-[var(--border)] mx-auto mb-3" />
                         <p className="text-[var(--text-secondary)]">Nenhuma anotação encontrada.</p>
                      </div>
                   )
                )}
             </div>
           </div>
        )}

        {activeTab === 'Tarefas' && (
           <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
             {filteredOps.length > 0 ? (
               <div className="divide-y divide-[var(--border)]">
                 {filteredOps.map(task => (
                   <div key={task.id} className={`p-4 flex gap-4 hover:bg-[var(--bg-base)] transition-colors group ${task.status === 'Concluída' ? 'opacity-60' : ''}`}>
                     <button onClick={() => handleCompleteTask(task)} className="mt-1 flex-shrink-0 text-[var(--text-tertiary)] hover:text-[#4CAF7D] transition">
                       <CheckCircle className={`w-[18px] h-[18px] ${task.status === 'Concluída' ? 'text-[#4CAF7D] fill-[#4CAF7D]/20' : ''}`} />
                     </button>
                     <div className="flex-1">
                       <div className="flex items-start justify-between">
                         <h4 className={`text-base font-semibold text-[var(--text-primary)] tracking-tight ${task.status === 'Concluída' ? 'line-through' : ''}`}>
                            {getOpDisplayTitle(task)}
                         </h4>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleOpenModal(task)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"><Edit2 className="w-[14px] h-[14px]"/></button>
                            <button onClick={() => setDeletingId(task.id!)} className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"><Trash2 className="w-[14px] h-[14px]"/></button>
                         </div>
                       </div>
                       {task.description && (
                         <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{task.description}</p>
                       )}
                       {task.checklistItems && task.checklistItems.length > 0 && (
                         <div className="mt-3">
                           <button
                             onClick={() => {
                               setExpandedTasks(prev => 
                                 prev.includes(task.id!) 
                                   ? prev.filter(id => id !== task.id!)
                                   : [...prev, task.id!]
                               );
                             }}
                             className="group/check flex items-center gap-2 hover:bg-[var(--bg-base)] px-2 py-1 -ml-2 rounded transition-colors text-left"
                           >
                             <div className="font-mono text-[10px] tracking-widest text-[var(--text-secondary)] flex items-center gap-1 group-hover/check:text-[var(--text-primary)]">
                               <CheckSquare className="w-3 h-3" />
                               <span className="text-[var(--accent)] tracking-[0.2em] font-bold">
                                 {'█'.repeat(Math.round((task.checklistItems.filter(i => i.done).length / task.checklistItems.length) * 10))}
                                 {'░'.repeat(10 - Math.round((task.checklistItems.filter(i => i.done).length / task.checklistItems.length) * 10))}
                               </span>
                               <span className="ml-1 tracking-tight">{task.checklistItems.filter(i => i.done).length}/{task.checklistItems.length} itens</span>
                             </div>
                           </button>

                           {expandedTasks.includes(task.id!) && (
                             <div className="mt-2 space-y-2 pl-1 border-l-2 border-[var(--border)] ml-1">
                               {task.checklistItems.map((item, index) => (
                                 <label key={item.id} className="flex items-start gap-2 cursor-pointer group/item">
                                   <input
                                     type="checkbox"
                                     checked={item.done}
                                     onChange={async (e) => {
                                       const newItems = [...task.checklistItems!];
                                       newItems[index].done = e.target.checked;
                                       try {
                                         await updateOperation(task.id!, { checklistItems: newItems });
                                         loadData();
                                       } catch (err) {
                                         addToast('Erro ao atualizar item', 'error');
                                       }
                                     }}
                                     className="mt-0.5 w-3.5 h-3.5 text-[var(--accent)] bg-[var(--bg-base)] border border-[var(--border)] rounded focus:ring-[var(--accent)] focus:ring-offset-[var(--bg-surface)]"
                                   />
                                   <span className={`text-sm tracking-tight ${item.done ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-secondary)] group-hover/item:text-[var(--text-primary)]'}`}>
                                     {item.text}
                                   </span>
                                 </label>
                               ))}
                             </div>
                           )}
                         </div>
                       )}
                       <div className="flex flex-wrap items-center gap-2 mt-3">
                         {task.date && (
                           <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                             <Calendar className="w-3 h-3"/> {task.date.split('-').reverse().join('/')}
                           </span>
                         )}
                         {task.time && (
                           <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                             <Clock className="w-3 h-3"/> {task.time}
                           </span>
                         )}
                         <span className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                            task.priority === 'Alta' || task.priority === 'Crítica' ? 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/30' :
                            task.priority === 'Média' ? 'bg-[#E0BC6A]/10 text-[#E0BC6A] border-[#E0BC6A]/30' :
                            'bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/30'
                         }`}>
                           <Flag className="w-3 h-3"/> {task.priority}
                         </span>
                         {task.status !== 'Pendente' && task.status !== 'Concluída' && (
                           <span className="text-[10px] font-mono text-[#E0BC6A] uppercase bg-[#E0BC6A]/10 border border-[#E0BC6A]/30 px-1.5 py-0.5 rounded">{task.status}</span>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="text-center py-12">
                   <CheckCircle className="w-12 h-12 text-[var(--border)] mx-auto mb-3" />
                   <p className="text-[var(--text-secondary)]">Nenhuma tarefa pendente.</p>
                </div>
             )}
           </div>
        )}


      </main>

      {/* Modals and Forms */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOp ? "Editar Registro" : "Novo Registro"}>
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="flex space-x-1 bg-[var(--bg-base)] p-1 rounded-md w-full mb-4">
             <button type="button" onClick={() => setType('note')} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${type === 'note' ? 'bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Anotação</button>
             <button type="button" onClick={() => setType('task')} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${type === 'task' ? 'bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Tarefa</button>
          </div>

          {/* Vínculos */}
          <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-4 space-y-3">
             <p className="text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">Vincular a (Opcional)</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Motorista */}
                <div className="relative">
                  <input
                    type="text"
                    value={driverText}
                    onChange={e => { setDriverText(e.target.value); setDriverDropdownOpen(true); }}
                    onBlur={() => setTimeout(() => setDriverDropdownOpen(false), 150)}
                    placeholder="João Francisco de Almeida"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {driverDropdownOpen && driverText.trim().length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden">
                      {drivers
                        .filter(d => d.nome.toLowerCase().includes(driverText.toLowerCase()))
                        .slice(0, 2)
                        .map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onMouseDown={() => { setDriverText(d.nome); setDriverDropdownOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                          >
                            {d.nome}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Veículo */}
                <div className="relative">
                  <input
                    type="text"
                    value={vehicleText}
                    onChange={e => { setVehicleText(e.target.value.toUpperCase()); setVehicleDropdownOpen(true); }}
                    onBlur={() => setTimeout(() => setVehicleDropdownOpen(false), 150)}
                    placeholder="Digite a placa..."
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
                  />
                  {vehicleDropdownOpen && vehicleText.trim().length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden">
                      {vehicles
                        .filter(v => v.placa.toLowerCase().includes(vehicleText.toLowerCase()))
                        .slice(0, 2)
                        .map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onMouseDown={() => { setVehicleText(v.placa); setVehicleDropdownOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm font-mono text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                          >
                            {v.placa}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Data do Evento *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
                />
             </div>
             <div>
                <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Hora (Opcional)</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent)]"
                />
             </div>
          </div>

          {type === 'note' && (
            <>
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalhes adicionais..."
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none text-sm tracking-tight"
                />
              </div>
              <div className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   id="isPinned"
                   checked={isPinned}
                   onChange={e => setIsPinned(e.target.checked)}
                   className="w-4 h-4 text-[var(--accent)] bg-[var(--bg-base)] border border-[var(--border)] rounded focus:ring-[var(--accent)] focus:ring-offset-[var(--bg-surface)]"
                 />
                 <label htmlFor="isPinned" className="text-sm font-medium text-[var(--text-primary)]">
                   Fixar anotação
                 </label>
              </div>
            </>
          )}

          {type === 'task' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Categoria</label>
                   <select
                     value={category}
                     onChange={e => setCategory(e.target.value)}
                     className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                   >
                     <option value="Operacional">Operacional</option>
                     <option value="Programação">Programação</option>
                     <option value="Manutenção">Manutenção</option>
                     <option value="Cliente">Cliente</option>
                     <option value="Extra">Extra</option>
                     <option value="Outro">Outro</option>
                   </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalhes adicionais da tarefa..."
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none text-sm tracking-tight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Checklist (Opcional)</label>
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={e => {
                          const newItems = [...checklistItems];
                          newItems[index].done = e.target.checked;
                          setChecklistItems(newItems);
                        }}
                        className="w-4 h-4 text-[var(--accent)] bg-[var(--bg-base)] border border-[var(--border)] rounded focus:ring-[var(--accent)] focus:ring-offset-[var(--bg-surface)]"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={e => {
                          const newItems = [...checklistItems];
                          newItems[index].text = e.target.value;
                          setChecklistItems(newItems);
                        }}
                        placeholder="Novo item..."
                        className="flex-1 bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setChecklistItems(checklistItems.filter(i => i.id !== item.id));
                        }}
                        className="p-1 text-[var(--text-tertiary)] hover:text-[#E05252] transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setChecklistItems([...checklistItems, { id: Date.now().toString(), text: '', done: false }]);
                    }}
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition mt-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar item
                  </button>
                </div>
              </div>
            </>
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

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction?.type === 'edit' ? "Editar anotação passada" : "Excluir anotação passada"}
        description={`Esta anotação é de uma data anterior (${pendingAction?.op?.date}). ${pendingAction?.type === 'edit' ? 'Editar' : 'Excluir'} pode afetar relatórios já gerados. Deseja continuar?`}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === 'edit') {
            handleOpenModal(pendingAction.op, true);
          } else {
            handleRequestDelete(pendingAction.op, true);
          }
          setPendingAction(null);
        }}
        onClose={() => setPendingAction(null)}
        confirmText={pendingAction?.type === 'edit' ? "Editar mesmo assim" : "Excluir mesmo assim"}
        isDestructive={true}
      />

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Gerar Relatório">
        <div className="space-y-4">
          <textarea
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            rows={15}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] font-mono text-xs whitespace-pre-wrap focus:outline-none focus:border-[var(--accent)] resize-none"
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
               onClick={() => {
                 navigator.clipboard.writeText(reportText);
                 addToast('Copiado para a área de transferência', 'success');
               }}
               className="px-4 py-2 text-sm font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)] rounded-md transition-colors"
            >
              Copiar Texto
            </button>
            <button
               onClick={() => {
                 // Basic text to PDF
                 import('jspdf').then(({ default: jsPDF }) => {
                   const splitDate = selectedDate.split('-');
                   const formattedDate = `${splitDate[2]}/${splitDate[1]}/${splitDate[0]}`;
                   const doc = new jsPDF();
                   doc.setFont("helvetica", "normal");
                   doc.setFontSize(12);
                   
                   const lines = doc.splitTextToSize(pdfReportText, 180);
                   doc.text(lines, 15, 20);
                   doc.save(`Anotacoes_${formattedDate.replace(/\//g, '-')}.pdf`);
                 });
               }}
               className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-[#0C0D0F] hover:bg-[var(--accent-hover)] rounded-md transition-colors"
            >
              Baixar PDF
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Excluir Registro"
        description="Tem certeza que deseja excluir? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
        confirmText="Excluir"
        isDestructive={true}
      />
    </div>
  );
}

// Subcomponent: NoteCard
function NoteCard({ note, onEdit, onDelete, onTogglePin, viewMode }: { note: OperationLog, onEdit: () => void, onDelete: () => void, onTogglePin: () => void, viewMode?: string }) {
   const isReadOnly = note.id?.startsWith('sched-');

   return (
      <div className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all group relative ${viewMode === 'list' ? 'flex flex-row items-center gap-4' : 'flex flex-col min-h-[140px]'}`}>
         {(!isReadOnly) && (
            <button onClick={onTogglePin} className={`absolute top-4 right-4 p-1.5 transition rounded-full ${note.isPinned ? 'text-[#D4A843] bg-[var(--accent-tint)]' : 'text-[var(--text-tertiary)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100'}`}>
               <Pin className="w-3.5 h-3.5" />
            </button>
         )}
         
         <div className="flex-1 pr-8">
            <h4 className="font-semibold text-[var(--text-primary)] leading-tight mb-2 pr-4">
              {[note.vehicleRef || note.vehicleId, note.driverRef || note.driverId].filter(Boolean).join(' · ') || note.category || 'Anotação'}
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-2 relative z-10">
               {note.category && (
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                     {note.category}
                  </span>
               )}
               {isReadOnly && (
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#5B8FDB] bg-[#5B8FDB]/10 border border-[#5B8FDB]/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                     <Calendar className="w-3 h-3" /> Programação
                  </span>
               )}
            </div>
            {note.description && (
               <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-4">{note.description}</p>
            )}
         </div>

         <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
               {note.date && <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(note.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
               {note.time && <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1"><Clock className="w-3 h-3"/> {note.time}</span>}
            </div>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={onEdit} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"><Edit2 className="w-[14px] h-[14px]"/></button>
                  {(!isReadOnly) && (
                     <button onClick={onDelete} className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"><Trash2 className="w-[14px] h-[14px]"/></button>
                  )}
               </div>
         </div>
      </div>
   )
}

