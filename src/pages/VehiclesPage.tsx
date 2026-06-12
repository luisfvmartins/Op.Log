import { useState, useEffect, useRef } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, Upload, Download, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, Vehicle } from '../services/vehicles';
import { getDrivers, Driver, createDriver } from '../services/drivers';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UnifiedHeader } from '../components/UnifiedHeader';
import { useViewPrefs } from '../hooks/useViewPrefs';

import { AboutModal } from '../components/ui/AboutModal';

export function VehiclesPage({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const { viewMode, setViewMode, sortBy, setSortBy } = useViewPrefs('vehicles', 'grid', 'recentes');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Form State
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Trucado');
  const [status, setStatus] = useState('Disponível');
  
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (user?.uid) {
      loadVehicles();
      loadDrivers();
    }
  }, [user]);

  const loadDrivers = async () => {
    try {
      if (user) {
        const data = await getDrivers(user.uid);
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      if (user) {
        const data = await getVehicles(user.uid);
        setVehicles(data);
      }
    } catch (err) {
      addToast('Erro ao carregar veículos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (veh?: Vehicle) => {
    if (veh) {
      setEditingVehicle(veh);
      setPlaca(veh.placa);
      setTipo(veh.tipo);
      setStatus(veh.status);
    } else {
      setEditingVehicle(undefined);
      setPlaca('');
      setTipo('Trucado');
      setStatus('Disponível');
    }
    setIsModalOpen(true);
  };

  const formatPlate = (val: string) => {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 7);
  }

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaca(formatPlate(e.target.value));
  }

  const isPlateValid = (p: string) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!placa.trim() || !tipo || !status) {
      addToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    if (!isPlateValid(placa)) {
      addToast('A placa inserida é inválida', 'error');
      return;
    }

    // Prevenção de duplicidade de placa
    const existing = vehicles.find(v => v.placa === placa && v.id !== editingVehicle?.id);
    if (existing) {
      addToast('Esta placa já está cadastrada', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const data = {
        userId: user.uid,
        placa: placa.trim(),
        tipo,
        status,
      };

      if (editingVehicle?.id) {
        await updateVehicle(editingVehicle.id, data);
        addToast('Veículo atualizado', 'success');
      } else {
        await createVehicle(data);
        addToast('Veículo cadastrado', 'success');
      }
      setIsModalOpen(false);
      loadVehicles();
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
      await deleteVehicle(deletingId);
      addToast('Veículo excluído', 'success');
      setDeletingId(null);
      loadVehicles();
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
    if (selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVehicles.map(v => v.id!)));
    }
  };

  const handleDeleteSelected = async () => {
    setIsBusy(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteVehicle(id)));
      addToast(`${selectedIds.size} veículos excluídos`, 'success');
      setSelectedIds(new Set());
      setIsDeleteSelectedModalOpen(false);
      loadVehicles();
    } catch (err: any) {
      addToast('Erro ao excluir veículos: ' + err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  let filteredVehicles = vehicles.filter(v => {
    if (dashboardFilter) {
      if (dashboardFilter === 'total') return true;
      if (dashboardFilter === 'disp' && v.status !== 'Disponível') return false;
      if (dashboardFilter === 'prog' && v.status !== 'Programado') return false;
      if (dashboardFilter === 'manut' && v.status !== 'Manutenção') return false;
      if (dashboardFilter === 'inativo' && v.status !== 'Inativo') return false;
    }
    return v.placa.includes(searchQuery.toUpperCase()) ||
           v.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
           v.status.toLowerCase().includes(searchQuery.toLowerCase());
  });

  filteredVehicles.sort((a, b) => {
    if (sortBy === 'placa-az') return a.placa.localeCompare(b.placa);
    if (sortBy === 'placa-za') return b.placa.localeCompare(a.placa);
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    if (sortBy === 'antigos') return timeA - timeB;
    return timeB - timeA;
  });

  const getStatusColor = (s: string) => {
    if (s === 'Disponível') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (s === 'Programado') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (s === 'Manutenção') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    if (s === 'Inativo') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const handleExport = () => {
    const data = { veiculos: vehicles };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veiculos-${new Date().toISOString().split('T')[0]}.json`;
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

        const listV = json.veiculos || json.Veiculos || json.Veículos || (Array.isArray(json) ? json : []);
        for (const item of listV) {
          const placaStr = item.placa || item.Placa;
          if (placaStr) {
            const formatted = formatPlate(String(placaStr));
            if (formatted && !vehicles.find(v => v.placa === formatted)) {
              await createVehicle({
                userId: user.uid,
                placa: formatted,
                tipo: item.tipo || item.Tipo || 'Trucado',
                status: item.status || item.Status || 'Disponível'
              });
              importedV++;
            }
          }
        }

        const listM = json.motoristas || json.Motoristas || [];
        if (Array.isArray(listM) && listM.length > 0) {
          const existingM = await getDrivers(user.uid);
          for (const item of listM) {
            const nomeStr = item.nome || item.Nome;
            if (nomeStr && !existingM.find(d => d.nome.toLowerCase() === String(nomeStr).toLowerCase())) {
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
        }

        if (importedM > 0 || importedV > 0) {
          addToast(`Importado: ${importedM} motoristas, ${importedV} veículos.`, 'success');
          loadVehicles();
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
      <UnifiedHeader
        title="Veículos"
        subtitle={`${vehicles.length} veículos registrados`}
        totalCount={vehicles.length}
        filteredCount={filteredVehicles.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode as 'grid'|'list'}
        setViewMode={(m) => setViewMode(m as 'grid'|'list')}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOptions={[
          {value: 'recentes', label: 'Mais recentes'},
          {value: 'antigos', label: 'Mais antigos'},
          {value: 'placa-az', label: 'Placa (A-Z)'},
          {value: 'placa-za', label: 'Placa (Z-A)'}
        ]}
        onOpenModal={() => handleOpenModal()}
        buttonText="Novo Veículo"
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setAboutModalOpen={setIsAboutModalOpen}
        onImport={handleImport}
        onExport={handleExport}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        onDeleteSelected={() => setIsDeleteSelectedModalOpen(true)}
        searchPlaceholder="Pesquisar veículo..."
      />

      <main className="p-6 max-w-[1600px] mx-auto pb-32">
        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button onClick={() => setDashboardFilter(dashboardFilter === 'total' ? null : 'total')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'total' ? 'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
             <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
             <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'total' ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>{vehicles.length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'disp' ? null : 'disp')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'disp' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-200'}`}>
             <p className="text-xs text-slate-500 font-medium uppercase">Disponíveis</p>
             <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'disp' ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{vehicles.filter(v => v.status === 'Disponível').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'prog' ? null : 'prog')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'prog' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-200'}`}>
             <p className="text-xs text-slate-500 font-medium uppercase">Programados</p>
             <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'prog' ? 'text-blue-700 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}>{vehicles.filter(v => v.status === 'Programado').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'manut' ? null : 'manut')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'manut' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-amber-200'}`}>
             <p className="text-xs text-slate-500 font-medium uppercase">Manutenção</p>
             <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'manut' ? 'text-amber-700 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>{vehicles.filter(v => v.status === 'Manutenção').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'inativo' ? null : 'inativo')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'inativo' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-red-200'}`}>
             <p className="text-xs text-slate-500 font-medium uppercase">Inativos</p>
             <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'inativo' ? 'text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'}`}>{vehicles.filter(v => v.status === 'Inativo').length}</p>
          </button>
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
             <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400">Nenhum veículo encontrado.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(v => {
              const vincDrivers = drivers.filter(d => d.veiculoPadraoId === v.id);
              return (
              <div key={v.id} 
                className={`bg-white dark:bg-white/5 border rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500/50 transition flex flex-col relative group cursor-pointer ${
                  selectedIds.has(v.id!) ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-500/50' : 'border-slate-200 dark:border-white/10'
                }`}
                onClick={() => toggleSelection(v.id!)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => toggleSelection(v.id!, e)} 
                      className={`text-slate-300 hover:text-blue-500 transition ${selectedIds.has(v.id!) ? 'text-blue-600 dark:text-blue-400' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                       <Truck className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight font-mono">{v.placa}</h3>
                      <p className="text-sm text-slate-500">{v.tipo}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${getStatusColor(v.status)}`}>
                    {v.status}
                  </span>
                </div>

                {vincDrivers.length > 0 && (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-white/10 pt-3">
                    <span className="font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Motorista(s) Vinculado(s):</span>
                    <span className="truncate block" title={vincDrivers.map(d => d.nome).join(', ')}>
                      {vincDrivers.map(d => d.nome).join(', ')}
                    </span>
                  </div>
                )}

                <div className={`${vincDrivers.length > 0 ? 'mt-4 pt-4' : 'mt-auto pt-4'} flex items-center justify-between border-t border-slate-100 dark:border-white/10`}>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(v); }} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(v.id!); }} 
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
            );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                   <thead className="bg-slate-50 dark:bg-[#09090B]/50 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                      <tr>
                         <th className="px-4 py-3 w-12 text-center">
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-500 transition">
                               <CheckSquare className={`w-5 h-5 ${selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            </button>
                         </th>
                         <th className="px-4 py-3 text-left"></th>
                         <th className="px-4 py-3 text-left">PLACA</th>
                         <th className="px-4 py-3 text-left">TIPO</th>
                         <th className="px-4 py-3 text-left">MOTORISTA(S)</th>
                         <th className="px-4 py-3 text-left">STATUS</th>
                         <th className="px-5 py-3 text-right">AÇÕES</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredVehicles.map(v => {
                         const vincDrivers = drivers.filter(d => d.veiculoPadraoId === v.id);
                         return (
                         <tr key={v.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer ${selectedIds.has(v.id!) ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`} onClick={() => toggleSelection(v.id!)}>
                            <td className="px-4 py-3 text-center">
                               <button onClick={(e) => toggleSelection(v.id!, e)} className={`text-slate-300 hover:text-blue-500 transition ${selectedIds.has(v.id!) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                  <CheckSquare className="w-5 h-5" />
                               </button>
                            </td>
                            <td className="px-4 py-3 w-14">
                              <div className="w-8 h-8 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                <Truck className="w-4 h-4 text-slate-500" />
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white font-mono">{v.placa}</td>
                            <td className="px-4 py-3 text-slate-500 text-sm">{v.tipo}</td>
                            <td className="px-4 py-3 text-slate-500 text-sm max-w-[200px] truncate" title={vincDrivers.map(d => d.nome).join(', ')}>
                               {vincDrivers.length > 0 ? vincDrivers.map(d => d.nome).join(', ') : '-'}
                            </td>
                            <td className="px-4 py-3">
                               <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${getStatusColor(v.status)}`}>{v.status}</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleOpenModal(v); }}
                                 className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                               >
                                 <Edit2 className="w-4 h-4"/>
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setDeletingId(v.id!); }}
                                 className="p-1.5 text-slate-400 hover:text-red-600 transition"
                               >
                                 <Trash2 className="w-4 h-4"/>
                               </button>
                            </td>
                         </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVehicle ? "Editar Veículo" : "Novo Veículo"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Placa do Cavalo</label>
            <input
              type="text"
              required
              value={placa}
              onChange={handlePlacaChange}
              maxLength={7}
              placeholder="ABC1D23"
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono uppercase tracking-widest"
            />
             {placa.length > 0 && !isPlateValid(placa) && <span className="text-xs text-red-500 mt-1 block">Placa inválida</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Cavalo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="Simples">Simples</option>
              <option value="Trucado">Trucado</option>
              <option value="Traçado">Traçado</option>
            </select>
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
              <option value="Manutenção">Manutenção</option>
              <option value="Inativo">Inativo</option>
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
        title="Excluir Veículo"
        description="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
        confirmText="Excluir"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={isDeleteSelectedModalOpen}
        title="Excluir Veículos"
        description={`Tem certeza que deseja excluir os ${selectedIds.size} veículos selecionados? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteSelected}
        onClose={() => setIsDeleteSelectedModalOpen(false)}
        confirmText="Excluir"
        isDestructive={true}
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

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

    </div>
  );
}
