import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, MapPin, Map, Calendar, Edit2, Trash2, Upload, Download, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDrivers, createDriver, updateDriver, deleteDriver, Driver } from '../services/drivers';
import { getVehicles, createVehicle, Vehicle } from '../services/vehicles';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UnifiedHeader } from '../components/UnifiedHeader';
import { useViewPrefs } from '../hooks/useViewPrefs';

import { AboutModal } from '../components/ui/AboutModal';

export function DriversPage({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const { viewMode, setViewMode, sortBy, setSortBy } = useViewPrefs('drivers', 'grid', 'recentes');
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
  const [veiculoPadraoId, setVeiculoPadraoId] = useState<string>('');
  const [vehicleSearchDisplay, setVehicleSearchDisplay] = useState('');
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadDrivers();
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    try {
      if (user) {
        const data = await getVehicles(user.uid);
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
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
      addToast('Veículo criado e vinculado com sucesso.', 'success');
      await loadVehicles();
      setVeiculoPadraoId(vid);
      setVehicleSearchDisplay(placa.toUpperCase());
      setVehicleDropdownOpen(false);
    } catch(err) {
      addToast('Erro ao criar veículo', 'error');
    } finally {
      setIsBusy(false);
    }
  };

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
      setVeiculoPadraoId(driver.veiculoPadraoId || '');
      if (driver.veiculoPadraoId) {
         const v = vehicles.find(v => v.id === driver.veiculoPadraoId);
         setVehicleSearchDisplay(v ? v.placa : '');
      } else {
         setVehicleSearchDisplay('');
      }
    } else {
      setEditingDriver(undefined);
      setNome('');
      setTipo('Regional');
      setInicio('08:00');
      setFim('18:00');
      setStatus('Disponível');
      setVeiculoPadraoId('');
      setVehicleSearchDisplay('');
    }
    setVehicleDropdownOpen(false);
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
        ...(veiculoPadraoId ? { veiculoPadraoId } : { veiculoPadraoId: '' })
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

  let filteredDrivers = drivers.filter(d => {
    if (dashboardFilter) {
      if (dashboardFilter === 'total') return true;
      if (dashboardFilter === 'disp' && d.status !== 'Disponível') return false;
      if (dashboardFilter === 'prog' && d.status !== 'Programado') return false;
      if (dashboardFilter === 'folga' && d.status !== 'Folga') return false;
      if (dashboardFilter === 'afast' && !['Férias', 'Afastado'].includes(d.status)) return false;
    }
    return d.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
           d.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
           d.status.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      <UnifiedHeader
        title="Motoristas"
        subtitle={`${drivers.length} motoristas registrados`}
        totalCount={drivers.length}
        filteredCount={filteredDrivers.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode as 'grid'|'list'}
        setViewMode={(m) => setViewMode(m as 'grid'|'list')}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOptions={[
          {value: 'recentes', label: 'Mais recentes'},
          {value: 'antigos', label: 'Mais antigos'},
          {value: 'nome-az', label: 'Nome (A-Z)'},
          {value: 'nome-za', label: 'Nome (Z-A)'}
        ]}
        onOpenModal={() => handleOpenModal()}
        buttonText="Novo Motorista"
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setAboutModalOpen={setIsAboutModalOpen}
        onImport={handleImport}
        onExport={handleExport}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        onDeleteSelected={() => setIsDeleteSelectedModalOpen(true)}
        searchPlaceholder="Pesquisar motorista..."
      />

      <main className="p-6 max-w-[1600px] mx-auto pb-32">
        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button onClick={() => setDashboardFilter(dashboardFilter === 'total' ? null : 'total')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'total' ? 'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
            <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'total' ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>{drivers.length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'disp' ? null : 'disp')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'disp' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-200'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase">Disponíveis</p>
            <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'disp' ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{drivers.filter(d => d.status === 'Disponível').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'prog' ? null : 'prog')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'prog' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-200'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase">Programados</p>
            <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'prog' ? 'text-blue-700 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}>{drivers.filter(d => d.status === 'Programado').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'folga' ? null : 'folga')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'folga' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-amber-200'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase">Folga</p>
            <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'folga' ? 'text-amber-700 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>{drivers.filter(d => d.status === 'Folga').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'afast' ? null : 'afast')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'afast' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-purple-200'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase">Férias/Afastado</p>
            <p className={`text-2xl font-bold mt-1 ${dashboardFilter === 'afast' ? 'text-purple-700 dark:text-purple-400' : 'text-purple-600 dark:text-purple-400'}`}>{drivers.filter(d => ['Férias', 'Afastado'].includes(d.status)).length}</p>
          </button>
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
                  {d.veiculoPadraoId && (
                     <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
                        <span className="font-medium" title="Veículo Padrão">
                          {vehicles.find(v => v.id === d.veiculoPadraoId)?.placa || 'Sem Veículo'}
                        </span>
                     </div>
                  )}
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
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                   <thead className="bg-slate-50 dark:bg-[#09090B]/50 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                      <tr>
                         <th className="px-4 py-3 w-12 text-center">
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-500 transition">
                               <CheckSquare className={`w-5 h-5 ${selectedIds.size === filteredDrivers.length && filteredDrivers.length > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            </button>
                         </th>
                         <th className="px-4 py-3 text-left">NOME</th>
                         <th className="px-4 py-3 text-left">TIPO</th>
                         <th className="px-4 py-3 text-left">JORNADA</th>
                         <th className="px-4 py-3 text-left">STATUS</th>
                         <th className="px-4 py-3 text-right">AÇÕES</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredDrivers.map(d => (
                         <tr key={d.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer ${selectedIds.has(d.id!) ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`} onClick={() => toggleSelection(d.id!)}>
                            <td className="px-4 py-3 text-center">
                               <button onClick={(e) => toggleSelection(d.id!, e)} className={`text-slate-300 hover:text-blue-500 transition ${selectedIds.has(d.id!) ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                  <CheckSquare className="w-5 h-5" />
                               </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{d.nome}</td>
                            <td className="px-4 py-3 text-slate-500 text-sm">{d.tipo}</td>
                            <td className="px-4 py-3 text-slate-500 text-sm">
                               <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/>{d.inicioJornada} - {d.fimJornada}</div>
                               {d.veiculoPadraoId && (
                                  <div className="text-xs mt-1 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded inline-block w-max">
                                     {vehicles.find(v => v.id === d.veiculoPadraoId)?.placa}
                                  </div>
                               )}
                            </td>
                            <td className="px-4 py-3">
                               <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border ${getStatusColor(d.status)}`}>{d.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
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

          <div className="relative border-b-0">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Veículo Padrão (Opcional)</label>
            <div className="relative">
               <input
                 type="text"
                 value={vehicleSearchDisplay}
                 placeholder="Digite a placa..."
                 className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                 onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setVehicleSearchDisplay(val);
                    setVehicleDropdownOpen(true);
                    if (!val) setVeiculoPadraoId('');
                 }}
                 onFocus={() => setVehicleDropdownOpen(true)}
               />
               {vehicleDropdownOpen && vehicleSearchDisplay && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1E1E24] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden flex flex-col">
                     {vehicles
                        .filter(v => v.placa.includes(vehicleSearchDisplay))
                        .slice(0, 2)
                        .map(v => (
                           <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                 setVeiculoPadraoId(v.id!);
                                 setVehicleSearchDisplay(v.placa);
                                 setVehicleDropdownOpen(false);
                              }}
                              className="text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0 text-slate-900 dark:text-white font-mono"
                           >
                              {v.placa} <span className="text-slate-500 text-sm font-sans mx-2">({v.tipo})</span>
                           </button>
                        ))
                     }
                     {vehicles.filter(v => v.placa === vehicleSearchDisplay).length === 0 && vehicleSearchDisplay.length > 5 && (
                        <div className="px-4 py-3 bg-slate-50 dark:bg-white/5">
                           <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Placa não encontrada.</p>
                           <button
                              type="button"
                              onClick={() => {
                                handleQuickCreateVehicle(vehicleSearchDisplay);
                              }}
                              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
                           >
                              Cadastrar placa {vehicleSearchDisplay}?
                           </button>
                        </div>
                     )}
                     <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-xs text-slate-500 flex justify-end">
                       <button type="button" onClick={() => setVehicleDropdownOpen(false)}>Fechar lista</button>
                     </div>
                  </div>
               )}
            </div>
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
        description="Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
        confirmText="Excluir"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={isDeleteSelectedModalOpen}
        title="Excluir Motoristas"
        description={`Tem certeza que deseja excluir os ${selectedIds.size} motoristas selecionados? Esta ação não pode ser desfeita.`}
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
