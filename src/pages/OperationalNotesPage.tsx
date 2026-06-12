import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOperations, createOperation, updateOperation, deleteOperation, OperationLog } from '../services/operations';
import { getDrivers, Driver } from '../services/drivers';
import { getVehicles, Vehicle } from '../services/vehicles';
import { getSchedules, Schedule } from '../services/schedules';
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
  
  const [operations, setOperations] = useState<OperationLog[]>([]);
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

  // Form
  const [type, setType] = useState<'note' | 'task'>('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operacional');
  const [priority, setPriority] = useState('Baixa');
  const [status, setStatus] = useState('Pendente');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
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
         setOperations(ops);
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

  const handleOpenModal = (op?: OperationLog) => {
    if (op) {
      setEditingOp(op);
      setType(op.type as 'note' | 'task');
      setTitle(op.title);
      setDescription(op.description || '');
      setCategory(op.category || 'Operacional');
      setPriority(op.priority || 'Baixa');
      setStatus(op.status || 'Pendente');
      setDueDate(op.date || '');
      setDueTime(op.time || '');
      setDriverId(op.driverId || '');
      setVehicleId(op.vehicleId || '');
      setIsPinned(op.isPinned || false);
    } else {
      setEditingOp(undefined);
      setType(activeTab === 'Tarefas' ? 'task' : 'note');
      setTitle('');
      setDescription('');
      setCategory('Operacional');
      setPriority('Baixa');
      setStatus('Pendente');
      setDueDate('');
      setDueTime('');
      setDriverId('');
      setVehicleId('');
      setIsPinned(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      addToast('Preencha o título', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const data: any = {
        userId: user.uid,
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: type === 'task' ? status : '',
        date: dueDate,
        time: dueTime,
        driverId,
        vehicleId,
        isPinned
      };
      
      // Remove any remaining undefined values just in case
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

      if (editingOp?.id) {
        await updateOperation(editingOp.id, data);
        addToast('Registro atualizado', 'success');
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

  const filteredOps = operations.filter(op => {
    const filterText = `${op.title} ${op.description} ${op.category}`.toLowerCase();
    const typeMatch = (activeTab === 'Anotações' && op.type === 'note') || (activeTab === 'Tarefas' && op.type === 'task');
    return filterText.includes(searchQuery.toLowerCase()) && typeMatch;
  }).sort((a, b) => {
    if (sortBy === 'az') {
      return a.title.localeCompare(b.title);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24">
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
          {value: 'az', label: 'Ordem alfabética'}
        ]}
        onOpenModal={() => handleOpenModal()}
        buttonText="Novo Registro"
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setAboutModalOpen={setIsAboutModalOpen}
        searchPlaceholder="Buscar registros..."
      />

      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 dark:bg-white/5 p-1 rounded-xl w-fit">
          {(['Anotações', 'Tarefas'] as const).map(tab => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab 
                     ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                     : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
               }`}
            >
               {tab}
            </button>
          ))}
        </div>

        {/* Content based on Tab */}
        {activeTab === 'Anotações' && (
           <div className="space-y-6">
             {pinnedNotes.length > 0 && (
                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Fixadas</h3>
                   <div className={viewMode === 'list' ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                      {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onEdit={() => handleOpenModal(note)} onDelete={() => setDeletingId(note.id!)} onTogglePin={() => handleTogglePin(note)} viewMode={viewMode} />)}
                   </div>
                </div>
             )}
             <div>
                {pinnedNotes.length > 0 && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 mt-8">Outras</h3>}
                {otherNotes.length > 0 ? (
                   <div className={viewMode === 'list' ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                      {otherNotes.map(note => <NoteCard key={note.id} note={note} onEdit={() => handleOpenModal(note)} onDelete={() => setDeletingId(note.id!)} onTogglePin={() => handleTogglePin(note)} viewMode={viewMode} />)}
                   </div>
                ) : (
                   !pinnedNotes.length && (
                      <div className="text-center py-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                         <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                         <p className="text-slate-500 dark:text-slate-400">Nenhuma anotação encontrada.</p>
                      </div>
                   )
                )}
             </div>
           </div>
        )}

        {activeTab === 'Tarefas' && (
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
             {filteredOps.length > 0 ? (
               <div className="divide-y divide-slate-100 dark:divide-white/10">
                 {filteredOps.map(task => (
                   <div key={task.id} className={`p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition group ${task.status === 'Concluída' ? 'opacity-60' : ''}`}>
                     <button onClick={() => handleCompleteTask(task)} className="mt-1 flex-shrink-0 text-slate-300 hover:text-emerald-500 transition">
                       <CheckCircle className={`w-6 h-6 ${task.status === 'Concluída' ? 'text-emerald-500 fill-emerald-500/20' : ''}`} />
                     </button>
                     <div className="flex-1">
                       <div className="flex items-start justify-between">
                         <h4 className={`text-base font-semibold text-slate-900 dark:text-white ${task.status === 'Concluída' ? 'line-through' : ''}`}>
                            {task.title}
                         </h4>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleOpenModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => setDeletingId(task.id!)} className="p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4"/></button>
                         </div>
                       </div>
                       {task.description && (
                         <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                       )}
                       <div className="flex flex-wrap items-center gap-2 mt-3">
                         {task.date && (
                           <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                             <Calendar className="w-3 h-3"/> {task.date} {task.time}
                           </span>
                         )}
                         <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getPriorityColor(task.priority || 'Baixa')}`}>
                           <Flag className="w-3 h-3"/> {task.priority}
                         </span>
                         {task.status !== 'Pendente' && task.status !== 'Concluída' && (
                           <span className="text-[11px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">{task.status}</span>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="text-center py-12">
                   <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                   <p className="text-slate-500 dark:text-slate-400">Nenhuma tarefa pendente.</p>
                </div>
             )}
           </div>
        )}


      </main>

      {/* Modals and Forms */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOp ? "Editar Registro" : "Novo Registro"}>
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="flex space-x-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg w-full mb-4">
             <button type="button" onClick={() => setType('note')} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'note' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Anotação</button>
             <button type="button" onClick={() => setType('task')} className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'task' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Tarefa</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Conferir documento da carga 123"
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais..."
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
               <select
                 value={category}
                 onChange={e => setCategory(e.target.value)}
                 className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
               >
                 <option value="Operacional">Operacional</option>
                 <option value="Programação">Programação</option>
                 <option value="Manutenção">Manutenção</option>
                 <option value="Cliente">Cliente</option>
                 <option value="Outro">Outro</option>
               </select>
            </div>
            {type === 'task' && (
               <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Aguardando retorno">Aguardando retorno</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </div>
               </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{type === 'task' ? 'Prazo (Data)' : 'Data do Evento'}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                />
             </div>
          </div>

          {/* Vínculos */}
          <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50 dark:bg-white/5 space-y-3">
             <p className="text-xs font-bold text-slate-500 uppercase">Vincular a (Opcional)</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <select
                    value={driverId}
                    onChange={e => setDriverId(e.target.value)}
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-900 dark:text-white"
                 >
                    <option value="">Motorista...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                 </select>
                 <select
                    value={vehicleId}
                    onChange={e => setVehicleId(e.target.value)}
                    className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-900 dark:text-white font-mono"
                 >
                    <option value="">Veículo...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                 </select>
             </div>
          </div>

         {type === 'note' && (
            <div className="flex items-center gap-2">
               <input
                 type="checkbox"
                 id="isPinned"
                 checked={isPinned}
                 onChange={e => setIsPinned(e.target.checked)}
                 className="w-4 h-4 text-blue-600 rounded border-slate-300"
               />
               <label htmlFor="isPinned" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                 Fixar anotação
               </label>
            </div>
          )}

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
   return (
      <div className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:shadow-md transition group relative ${viewMode === 'list' ? 'flex flex-row items-center gap-4' : 'flex flex-col min-h-[140px]'}`}>
         <button onClick={onTogglePin} className={`absolute top-4 right-4 p-1.5 transition rounded-full ${note.isPinned ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100'}`}>
            <Pin className="w-4 h-4" />
         </button>
         
         <div className="flex-1 pr-8">
            <h4 className="font-semibold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 pr-4">{note.title}</h4>
            <div className="flex flex-wrap gap-1.5 mb-2 relative z-10">
               {note.category && (
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded tracking-wider">
                     {note.category}
                  </span>
               )}
            </div>
            {note.description && (
               <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">{note.description}</p>
            )}
         </div>

         <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
               {note.date && <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> {note.date}</span>}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
               <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Edit2 className="w-3.5 h-3.5"/></button>
               <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5"/></button>
            </div>
         </div>
      </div>
   )
}

