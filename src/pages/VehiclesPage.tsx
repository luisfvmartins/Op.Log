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
    if (s === 'Disponível') return 'bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/30';
    if (s === 'Programado') return 'bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--accent-border)]';
    if (s === 'Manutenção') return 'bg-[#E0BC6A]/10 text-[#E0BC6A] border-[#E0BC6A]/30';
    if (s === 'Inativo') return 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/30';
    return 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)]';
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
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
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
          <button onClick={() => setDashboardFilter(dashboardFilter === 'total' ? null : 'total')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'total' ? 'bg-[var(--accent-tint)] border-[var(--accent-border)]' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
             <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Total</p>
             <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'total' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{vehicles.length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'disp' ? null : 'disp')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'disp' ? 'bg-[#4CAF7D]/10 border-[#4CAF7D]/30' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#4CAF7D]/30'}`}>
             <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Disponíveis</p>
             <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'disp' ? 'text-[#4CAF7D]' : 'text-[#4CAF7D]'}`}>{vehicles.filter(v => v.status === 'Disponível').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'prog' ? null : 'prog')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'prog' ? 'bg-[var(--accent-tint)] border-[var(--accent-border)]' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--accent-border)]'}`}>
             <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Programados</p>
             <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'prog' ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}>{vehicles.filter(v => v.status === 'Programado').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'manut' ? null : 'manut')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'manut' ? 'bg-[#E0BC6A]/10 border-[#E0BC6A]/30' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#E0BC6A]/30'}`}>
             <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Manutenção</p>
             <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'manut' ? 'text-[#E0BC6A]' : 'text-[#E0BC6A]'}`}>{vehicles.filter(v => v.status === 'Manutenção').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'inativo' ? null : 'inativo')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'inativo' ? 'bg-[#E05252]/10 border-[#E05252]/30' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#E05252]/30'}`}>
             <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Inativos</p>
             <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'inativo' ? 'text-[#E05252]' : 'text-[#E05252]'}`}>{vehicles.filter(v => v.status === 'Inativo').length}</p>
          </button>
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 flex border-2 border-[var(--accent)] border-t-transparent rounded-full" /></div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
             <Truck className="w-12 h-12 text-[var(--border)] mx-auto mb-3" />
             <p className="text-[var(--text-secondary)]">Nenhum veículo encontrado.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(v => {
              const vincDrivers = drivers.filter(d => d.veiculoPadraoId === v.id);
              return (
              <div key={v.id} 
                className={`bg-[var(--bg-surface)] border rounded-xl overflow-hidden flex flex-col group cursor-pointer transition-all min-h-[200px] ${
                  selectedIds.has(v.id!) ? 'border-[var(--accent-border)] bg-[var(--accent-tint)]' : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                }`}
                onClick={() => toggleSelection(v.id!)}
              >
                <div className="p-5 flex-1 flex flex-col relative">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                     <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getStatusColor(v.status)}`}>
                       {v.status}
                     </span>
                     <button 
                       onClick={(e) => toggleSelection(v.id!, e)} 
                       className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.has(v.id!) ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)] opacity-0 group-hover:opacity-100'}`}
                     >
                        {selectedIds.has(v.id!) && <CheckSquare className="w-3.5 h-3.5" />}
                     </button>
                  </div>
                  <div className="flex items-start gap-3 mb-2 pr-16">
                    <div>
                      <h3 className="font-semibold text-base text-[var(--text-primary)] font-mono tracking-widest">{v.placa}</h3>
                      <p className="text-xs font-mono text-[var(--text-secondary)] uppercase">{v.tipo}</p>
                    </div>
                  </div>

                  {vincDrivers.length > 0 && (
                    <div className="mt-3 text-xs text-[var(--text-secondary)] border-l-2 border-[var(--accent)] pl-3 py-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] block mb-0.5">Motorista(s) Vinculado(s):</span>
                      <span className="truncate block font-medium" title={vincDrivers.map(d => d.nome).join(', ')}>
                        {vincDrivers.map(d => d.nome).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-base)] flex items-center justify-between">
                  <button className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline">
                     Programações
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(v); }} 
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                      title="Editar"
                    >
                      <Edit2 className="w-[14px] h-[14px]" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(v.id!); }} 
                      className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                   <thead className="bg-transparent border-b border-[var(--border)]">
                      <tr>
                         <th className="px-4 py-3 w-12 text-center text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">
                            <button onClick={toggleSelectAll} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors mx-auto ${selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0 ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)]'}`}>
                               {selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0 && <CheckSquare className="w-3 h-3" />}
                            </button>
                         </th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">PLACA</th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">TIPO</th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">MOTORISTA(S)</th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">STATUS</th>
                         <th className="px-5 py-3 pr-6 w-32 text-right text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">AÇÕES</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {filteredVehicles.map(v => {
                         const vincDrivers = drivers.filter(d => d.veiculoPadraoId === v.id);
                         return (
                         <tr key={v.id} className={`hover:bg-[var(--bg-surface)] transition cursor-pointer ${selectedIds.has(v.id!) ? 'bg-[var(--accent-tint)]' : ''}`} onClick={() => toggleSelection(v.id!)}>
                            <td className="px-4 py-3 text-center border-b border-[var(--border)]">
                               <button onClick={(e) => toggleSelection(v.id!, e)} className={`w-4 h-4 rounded border flex items-center justify-center mx-auto transition-colors ${selectedIds.has(v.id!) ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)]'}`}>
                                  {selectedIds.has(v.id!) && <CheckSquare className="w-3 h-3" />}
                               </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-[var(--text-primary)] font-mono border-b border-[var(--border)] text-sm tracking-widest">{v.placa}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] font-mono border-b border-[var(--border)] text-sm uppercase">{v.tipo}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] text-sm max-w-[200px] truncate border-b border-[var(--border)]" title={vincDrivers.map(d => d.nome).join(', ')}>
                               {vincDrivers.length > 0 ? vincDrivers.map(d => d.nome).join(', ') : '-'}
                            </td>
                            <td className="px-4 py-3 border-b border-[var(--border)]">
                               <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getStatusColor(v.status)}`}>{v.status}</span>
                            </td>
                            <td className="px-5 py-3 pr-6 text-right border-b border-[var(--border)]">
                               <div className="flex items-center justify-end gap-3">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleOpenModal(v); }}
                                   className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                                 >
                                   <Edit2 className="w-[14px] h-[14px]"/>
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setDeletingId(v.id!); }}
                                   className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"
                                 >
                                   <Trash2 className="w-[14px] h-[14px]"/>
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
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVehicle ? "Editar Veículo" : "Novo Veículo"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Placa do Cavalo</label>
            <input
              type="text"
              required
              value={placa}
              onChange={handlePlacaChange}
              maxLength={7}
              placeholder="ABC1D23"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono uppercase tracking-widest"
            />
             {placa.length > 0 && !isPlateValid(placa) && <span className="text-xs text-[#E05252] mt-1 block">Placa inválida</span>}
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Tipo de Cavalo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="Simples">Simples</option>
              <option value="Trucado">Trucado</option>
              <option value="Traçado">Traçado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[var(--accent)] px-6 py-3 rounded-xl flex items-center gap-6 shadow-[0_4px_24px_rgba(212,168,67,0.3)] animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-6 border-r border-[#0C0D0F]/10">
            <span className="w-6 h-6 bg-[#0C0D0F]/10 text-[#0C0D0F] rounded-md flex items-center justify-center text-xs font-mono font-bold">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium text-[#0C0D0F] hidden sm:inline">Selecionados</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDeleteSelectedModalOpen(true)}
              className="p-1.5 text-[#0C0D0F]/70 hover:text-[#0C0D0F] hover:bg-[#0C0D0F]/10 rounded-md transition-colors ml-2"
              title="Excluir selecionados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-[#0C0D0F]/70 hover:text-[#0C0D0F] transition-colors ml-2"
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
