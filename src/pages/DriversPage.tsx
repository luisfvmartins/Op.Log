import { useState, useEffect } from 'react';
import { Users, Plus, Search, MapPin, Map, Calendar, Edit2, Trash2, Upload, Download, LayoutGrid, List as ListIcon, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDrivers, createDriver, updateDriver, deleteDriver, Driver } from '../services/drivers';
import { getVehicles, createVehicle } from '../services/vehicles';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function DriversPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
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
        const json = JSON.parse(content);
        let importedM = 0;
        let importedV = 0;
        
        setIsBusy(true);

        const listM = json.motoristas || (Array.isArray(json) ? json : []);
        for (const item of listM) {
          if (item.nome && !drivers.find(d => d.nome === item.nome)) {
            await createDriver({
              userId: user.uid,
              nome: item.nome,
              tipo: item.tipo || 'Regional',
              inicioJornada: item.inicio || item.inicioJornada || '08:00',
              fimJornada: item.fim || item.fimJornada || '18:00',
              status: item.status || 'Disponível'
            });
            importedM++;
          }
        }

        if (json.veiculos && Array.isArray(json.veiculos)) {
          const existingV = await getVehicles(user.uid);
          for (const item of json.veiculos) {
            if (item.placa && !existingV.find(v => v.placa === item.placa)) {
              await createVehicle({
                userId: user.uid,
                placa: item.placa,
                tipo: item.tipo || 'Trucado',
                status: item.status || 'Disponível'
              });
              importedV++;
            }
          }
        }

        if (importedM > 0 || importedV > 0) {
          addToast(`Importado: ${importedM} motoristas, ${importedV} veículos`, 'success');
          loadDrivers();
        } else {
          addToast('Nenhum registro novo encontrado', 'info');
        }
      } catch (err: any) {
        addToast('Erro ao importar arquivo: ' + err.message, 'error');
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
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Motoristas</h1>
            <p className="text-slate-500 text-sm">Gerencie a equipe de motoristas da operação.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => document.getElementById('import-file-drivers')?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition"
              title="Importar de JSON"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition"
              title="Exportar para JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">Novo Motorista</span>
            </button>
          </div>
          <input type="file" id="import-file-drivers" accept=".json" onChange={handleImport} className="hidden" />
        </div>

        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar motorista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-10 pr-4 py-2 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="nome-az">Nome (A-Z)</option>
              <option value="nome-za">Nome (Z-A)</option>
            </select>
            
            <div className="flex bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mass Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {selectedIds.size} selecionado(s)
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase hover:underline"
              >
                Selecionar Todos
              </button>
            </div>
            <button
              onClick={() => setIsDeleteSelectedModalOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Selecionados
            </button>
          </div>
        )}

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
      </div>

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
    </div>
  );
}
