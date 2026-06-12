import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, MapPin, Map, Calendar, Edit2, Trash2, Upload, Download, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDrivers, createDriver, updateDriver, deleteDriver, Driver } from '../services/drivers';
import { getVehicles, createVehicle } from '../services/vehicles';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function DriversPage({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recentes');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Regional');
  const [inicio, setInicio] = useState('08:00');
  const [fim, setFim] = useState('18:00');
  const [status, setStatus] = useState('Disponível');

  useEffect(() => {
    if (user?.uid) {
      loadDrivers();
    }
  }, [user]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      if (user) {
        const data = await getDrivers(user.uid);
        setDrivers(data);
      }
    } catch (err) {
      addToast('Erro ao carregar motoristas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setNome(driver.nome);
      setTipo(driver.tipo);
      setInicio(driver.inicioJornada);
      setFim(driver.fimJornada);
      setStatus(driver.status);
    } else {
      setEditingDriver(undefined);
      setNome('');
      setTipo('Regional');
      setInicio('08:00');
      setFim('18:00');
      setStatus('Disponível');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!nome.trim() || !tipo || !inicio || !fim || !status) {
      addToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    const existing = drivers.find(d => d.nome.toLowerCase() === nome.trim().toLowerCase() && d.id !== editingDriver?.id);
    if (existing) {
      addToast('Este motorista já está cadastrado', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const data = {
        userId: user.uid,
        nome: nome.trim(),
        tipo,
        inicioJornada: inicio,
        fimJornada: fim,
        status,
      };

      if (editingDriver?.id) {
        await updateDriver(editingDriver.id, data);
        addToast('Motorista atualizado', 'success');
      } else {
        await createDriver(data);
        addToast('Motorista cadastrado', 'success');
      }
      setIsModalOpen(false);
      loadDrivers();
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
      await deleteDriver(deletingId);
      addToast('Motorista excluído', 'success');
      setDeletingId(null);
      loadDrivers();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDrivers.length && filteredDrivers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDrivers.map(d => d.id!)));
    }
  };

  const handleDeleteSelected = async () => {
    setIsBusy(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteDriver(id)));
      addToast(`${selectedIds.size} motoristas excluídos`, 'success');
      setSelectedIds(new Set());
      setIsDeleteSelectedModalOpen(false);
      loadDrivers();
    } catch (err: any) {
      addToast('Erro ao excluir motoristas: ' + err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  let filteredDrivers = drivers.filter(d => 
    d.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  filteredDrivers.sort((a, b) => {
    if (sortBy === 'nome-az') return a.nome.localeCompare(b.nome);
    if (sortBy === 'nome-za') return b.nome.localeCompare(a.nome);
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    if (sortBy === 'antigos') return timeA - timeB;
    return timeB - timeA;
  });

  const getStatusColor = (s: string) => {
    if (s === 'Disponível') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (s === 'Programado') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (s === 'Folga') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    if (s === 'Férias') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const handleExport = () => {
    const data = { motoristas: drivers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motoristas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error("Arquivo vazio");
        
        let json;
        try {
          json = JSON.parse(content);
        } catch (e) {
          throw new Error("Formato JSON inválido. Verifique se o arquivo está correto.");
        }

        let importedM = 0;
        let importedV = 0;
        
        setIsBusy(true);

        const listM = json.motoristas || json.Motoristas || (Array.isArray(json) ? json : []);
        for (const item of listM) {
          const nomeStr = item.nome || item.Nome;
          if (nomeStr && !drivers.find(d => d.nome.toLowerCase() === String(nomeStr).toLowerCase())) {
            await createDriver({
              userId: user.uid,
              nome: String(nomeStr).trim(),
              tipo: item.tipo || item.Tipo || 'Regional',
              inicioJornada: item.inicio || item.inicioJornada || item.Inicio || '08:00',
              fimJornada: item.fim || item.fimJornada || item.Fim || '18:00',
              status: item.status || item.Status || 'Disponível'
            });
            importedM++;
          }
        }

        const listV = json.veiculos || json.Veiculos || json.Veículos || [];
        if (Array.isArray(listV) && listV.length > 0) {
          const existingV = await getVehicles(user.uid);
          for (const item of listV) {
            const placaStr = item.placa || item.Placa;
            if (placaStr && !existingV.find(v => v.placa === String(placaStr).replace(/[^A-Za-z0-9]/g, '').toUpperCase())) {
              await createVehicle({
                userId: user.uid,
                placa: String(placaStr).replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 7),
                tipo: item.tipo || item.Tipo || 'Trucado',
                status: item.status || item.Status || 'Disponível'
              });
              importedV++;
            }
          }
        }

        if (importedM > 0 || importedV > 0) {
          addToast(`Importado: ${importedM} motoristas, ${importedV} veículos.`, 'success');
          loadDrivers();
        } else {
          addToast('Nenhum registro válido ou novo encontrado no arquivo.', 'info');
        }
      } catch (err: any) {
        addToast(err.message, 'error');
        console.error("Import error:", err);
      } finally {
        setIsBusy(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pb-24">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-8 py-4 flex flex-col gap-4">
        {/* PRIMEIRA LINHA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="select-none">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Motoristas</h1>
            <p className="text-sm text-slate-500 font-medium">{drivers.length} motoristas registrados</p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <Upload className="w-4 h-4" /> Importar
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={toggleTheme} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Tema
            </button>
            <button onClick={() => setIsAboutModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <Info className="w-4 h-4" /> Sobre
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>

        {/* SEGUNDA LINHA */}
        <div className="flex items-center justify-end">
          <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1">
            <button
              onClick={toggleSelectAll}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border-r border-slate-200 dark:border-white/10 mr-1 ${selectedIds.size === filteredDrivers.length && filteredDrivers.length > 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Todos
            </button>
            <div className="relative border-r border-slate-200 dark:border-white/10 mr-1">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer focus:outline-none dark:bg-[#09090B]"
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigos">Mais antigos</option>
                <option value="nome-az">Nome (A-Z)</option>
                <option value="nome-za">Nome (Z-A)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Cards
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <ListIcon className="w-4 h-4" /> Lista
            </button>
          </div>
        </div>

        {/* TERCEIRA LINHA */}
        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar motorista..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Motorista</span>
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto pb-32">
        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{drivers.length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Disponíveis</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{drivers.filter(d => d.status === 'Disponível').length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Programados</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{drivers.filter(d => d.status === 'Programado').length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Folga</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{drivers.filter(d => d.status === 'Folga').length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Férias/Afastado</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{drivers.filter(d => ['Férias', 'Afastado'].includes(d.status)).length}</p>
          </div>
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
             <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400">Nenhum motorista encontrado.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map(d => (
              <div key={d.id} 
                className={`bg-white dark:bg-white/5 border rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500/50 transition flex flex-col relative group cursor-pointer ${
                  selectedIds.has(d.id!) ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-500/50' : 'border-slate-200 dark:border-white/10'
                }`}
                onClick={() => toggleSelection(d.id!)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => toggleSelection(d.id!, e)} 
                      className={`text-slate-300 hover:text-blue-500 transition ${selectedIds.has(d.id!) ? 'text-blue-600 dark:text-blue-400' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{d.nome}</h3>
                      <p className="text-sm text-slate-500">{d.tipo}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{d.inicioJornada} - {d.fimJornada}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(d); }} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(d.id!); }} 
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                   <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      Programações
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                         <th className="p-4 w-12 text-center">
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-500 transition">
                               <CheckSquare className={`w-5 h-5 ${selectedIds.size === filteredDrivers.length && filteredDrivers.length > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            </button>
                         </th>
                         <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                         <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                         <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jornada</th>
                         <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                         <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredDrivers.map(d => (
                         <tr key={d.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer ${selectedIds.has(d.id!) ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`} onClick={() => toggleSelection(d.id!)}>
                            <td className="p-4 text-center">
                               <button onClick={(e) => toggleSelection(d.id!, e)} className={`text-slate-300 hover:text-blue-500 transition ${selectedIds.has(d.id!) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                  <CheckSquare className="w-5 h-5" />
                               </button>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{d.nome}</td>
                            <td className="p-4 text-slate-500 text-sm">{d.tipo}</td>
                            <td className="p-4 text-slate-500 text-sm flex items-center gap-1.5"><Calendar className="w-4 h-4"/>{d.inicioJornada} - {d.fimJornada}</td>
                            <td className="p-4">
                               <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${getStatusColor(d.status)}`}>{d.status}</span>
                            </td>
                            <td className="p-4 text-right">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleOpenModal(d); }}
                                 className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                               >
                                 <Edit2 className="w-4 h-4"/>
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setDeletingId(d.id!); }}
                                 className="p-1.5 text-slate-400 hover:text-red-600 transition"
                               >
                                 <Trash2 className="w-4 h-4"/>
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Editar Motorista" : "Novo Motorista"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="Manobra">Manobra</option>
              <option value="Avulso">Avulso</option>
              <option value="Regional">Regional</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início (HH:MM)</label>
              <input
                type="time"
                required
                value={inicio}
                onChange={e => setInicio(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim (HH:MM)</label>
              <input
                type="time"
                required
                value={fim}
                onChange={e => setFim(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="Disponível">Disponível</option>
              <option value="Programado">Programado</option>
              <option value="Folga">Folga</option>
              <option value="Férias">Férias</option>
              <option value="Afastado">Afastado</option>
            </select>
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

      <ConfirmDialog
        isOpen={deletingId !== null}
        title="Excluir Motorista"
        message="Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        confirmText="Excluir"
        type="danger"
      />

      <ConfirmDialog
        isOpen={isDeleteSelectedModalOpen}
        title="Excluir Motoristas"
        message={`Tem certeza que deseja excluir os ${selectedIds.size} motoristas selecionados? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteSelected}
        onCancel={() => setIsDeleteSelectedModalOpen(false)}
        confirmText="Excluir"
        type="danger"
      />

      {/* CONTEXTUAL ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-6 border-r border-slate-700 dark:border-slate-300">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium text-white dark:text-slate-900 hidden sm:inline">Selecionados</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDeleteSelectedModalOpen(true)}
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
              title="Excluir selecionados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-slate-300 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 transition-colors ml-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="Sobre"
      >
        <div className="p-2 sm:p-4 text-slate-600 dark:text-slate-300">
          <p className="text-sm sm:text-base leading-relaxed mb-6">
            O <strong>Op.Log</strong> é um aplicativo desenhado para gerenciar de forma simples e eficiente suas operações logísticas, locais, motoristas e veículos.
          </p>
          
          <div className="bg-slate-100 dark:bg-black/40 p-5 rounded-xl border border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Criador</h4>
            <p className="text-base text-slate-900 dark:text-white font-medium mb-4">
              Desenvolvido por Luis Martins
            </p>
            
            <div className="flex flex-col gap-3">
              <a 
                href="https://instagram.com/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                  <span className="w-4 h-4 text-center leading-4 font-bold text-xs">ig</span>
                </div>
                <span className="text-sm font-medium">@luisfvmartins</span>
              </a>
              <a 
                href="https://linkedin.com/in/luisfvmartins" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 bg-white dark:bg-white/5 shadow-sm rounded-md border border-slate-200 dark:border-white/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                  <span className="w-4 h-4 text-center leading-4 font-bold text-xs">in</span>
                </div>
                <span className="text-sm font-medium">/in/luisfvmartins</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
