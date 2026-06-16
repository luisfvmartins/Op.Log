import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, MapPin, Map, Calendar, Edit2, Trash2, Upload, Download, LayoutGrid, List as ListIcon, CheckSquare, Sun, Moon, Info, LogOut, Check, Truck, X } from 'lucide-react';
import { motion } from 'motion/react';
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
    if (s === 'Disponível') return 'bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/30';
    if (s === 'Programado') return 'bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--accent-border)]';
    if (s === 'Folga') return 'bg-[#E0BC6A]/10 text-[#E0BC6A] border-[#E0BC6A]/30';
    if (s === 'Férias' || s === 'Afastado') return 'bg-[#5B8FDB]/10 text-[#5B8FDB] border-[#5B8FDB]/30';
    return 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)]';
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
    <div className="flex flex-col flex-1 min-h-full pb-24 font-sans">
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

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button onClick={() => setDashboardFilter(dashboardFilter === 'total' ? null : 'total')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'total' ? 'bg-[var(--accent-tint)] border-[var(--accent-border)]' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
            <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Total</p>
            <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'total' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{drivers.length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'disp' ? null : 'disp')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'disp' ? 'bg-[#4CAF7D]/10 border-[#4CAF7D]/30' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#4CAF7D]/30'}`}>
            <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Disponíveis</p>
            <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'disp' ? 'text-[#4CAF7D]' : 'text-[#4CAF7D]'}`}>{drivers.filter(d => d.status === 'Disponível').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'prog' ? null : 'prog')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'prog' ? 'bg-[var(--accent-tint)] border-[var(--accent-border)]' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--accent-border)]'}`}>
            <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Programados</p>
            <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'prog' ? 'text-[var(--accent)]' : 'text-[var(--accent)]'}`}>{drivers.filter(d => d.status === 'Programado').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'folga' ? null : 'folga')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'folga' ? 'bg-[#E0BC6A]/10 border-[#E0BC6A]/30' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#E0BC6A]/30'}`}>
            <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Folga</p>
            <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'folga' ? 'text-[#E0BC6A]' : 'text-[#E0BC6A]'}`}>{drivers.filter(d => d.status === 'Folga').length}</p>
          </button>
          <button onClick={() => setDashboardFilter(dashboardFilter === 'afast' ? null : 'afast')} className={`text-left border rounded-xl p-4 transition-all ${dashboardFilter === 'afast' ? 'bg-[#5B8FDB]/10 border-[#5B8FDB]/30' : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[#5B8FDB]/30'}`}>
            <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">Férias/Afastado</p>
            <p className={`text-2xl font-semibold mt-1 font-mono ${dashboardFilter === 'afast' ? 'text-[#5B8FDB]' : 'text-[#5B8FDB]'}`}>{drivers.filter(d => ['Férias', 'Afastado'].includes(d.status)).length}</p>
          </button>
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 flex border-2 border-[var(--accent)] border-t-transparent rounded-full" /></div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
             <Users className="w-12 h-12 text-[var(--border)] mx-auto mb-3" />
             <p className="text-[var(--text-secondary)]">Nenhum motorista encontrado.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map(d => (
              <div key={d.id} 
                className={`bg-[var(--bg-surface)] border rounded-xl overflow-hidden flex flex-col group cursor-pointer transition-all min-h-[200px] ${
                  selectedIds.has(d.id!) ? 'border-[var(--accent-border)] bg-[var(--accent-tint)]' : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                }`}
                onClick={() => toggleSelection(d.id!)}
              >
                <div className="p-5 flex-1 flex flex-col relative">
                  <div className="flex items-start justify-between gap-2 mb-2 w-full">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base text-[var(--text-primary)] leading-snug break-words min-w-0">{d.nome}</h3>
                      <p className="text-xs font-mono text-[var(--text-secondary)] uppercase">{d.tipo}</p>
                    </div>
                    <div className="flex items-start gap-2 shrink-0 z-10">
                       <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono border ${getStatusColor(d.status)}`}>
                         {d.status}
                       </span>
                       <button 
                         onClick={(e) => toggleSelection(d.id!, e)} 
                         className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.has(d.id!) ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)] opacity-0 group-hover:opacity-100'}`}
                       >
                          {selectedIds.has(d.id!) && <CheckSquare className="w-3.5 h-3.5" />}
                       </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <span className="font-medium">{d.inicioJornada} - {d.fimJornada}</span>
                    </div>
                    {d.veiculoPadraoId && (
                       <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
                          <Truck className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                          <span className="font-medium" title="Veículo Padrão">
                            {vehicles.find(v => v.id === d.veiculoPadraoId)?.placa || 'Sem Veículo'}
                          </span>
                       </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-base)] flex items-center justify-between">
                  <button className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline">
                     Programações
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(d); }} 
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                      title="Editar"
                    >
                      <Edit2 className="w-[14px] h-[14px]" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(d.id!); }} 
                      className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                   <thead className="bg-transparent border-b border-[var(--border)]">
                      <tr>
                         <th className="px-4 py-3 w-12 text-center text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase">
                            <button onClick={toggleSelectAll} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors mx-auto ${selectedIds.size === filteredDrivers.length && filteredDrivers.length > 0 ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)]'}`}>
                               {selectedIds.size === filteredDrivers.length && filteredDrivers.length > 0 && <CheckSquare className="w-3 h-3" />}
                            </button>
                         </th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">NOME</th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">TIPO</th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">JORNADA</th>
                         <th className="px-4 py-3 text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">STATUS</th>
                         <th className="px-5 py-3 pr-6 w-32 text-right text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">AÇÕES</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {filteredDrivers.map(d => (
                         <tr key={d.id} className={`hover:bg-[var(--bg-surface)] transition cursor-pointer ${selectedIds.has(d.id!) ? 'bg-[var(--accent-tint)]' : ''}`} onClick={() => toggleSelection(d.id!)}>
                            <td className="px-4 py-3 text-center border-b border-[var(--border)]">
                               <button onClick={(e) => toggleSelection(d.id!, e)} className={`w-4 h-4 rounded border flex items-center justify-center mx-auto transition-colors ${selectedIds.has(d.id!) ? 'bg-[var(--accent)] border-[var(--accent)] text-[#0C0D0F]' : 'border-[var(--border)]'}`}>
                                  {selectedIds.has(d.id!) && <CheckSquare className="w-3 h-3" />}
                               </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">{d.nome}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] font-mono border-b border-[var(--border)] uppercase">{d.tipo}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] border-b border-[var(--border)]">
                               <div className="flex items-center gap-1.5 font-mono"><Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]"/>{d.inicioJornada} - {d.fimJornada}</div>
                               {d.veiculoPadraoId && (
                                  <div className="text-[10px] mt-1 text-[var(--text-tertiary)] font-mono inline-block w-max">
                                     {vehicles.find(v => v.id === d.veiculoPadraoId)?.placa}
                                  </div>
                               )}
                            </td>
                            <td className="px-4 py-3 border-b border-[var(--border)]">
                               <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getStatusColor(d.status)}`}>{d.status}</span>
                            </td>
                            <td className="px-5 py-3 pr-6 text-right border-b border-[var(--border)]">
                               <div className="flex items-center justify-end gap-3">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleOpenModal(d); }}
                                   className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                                 >
                                   <Edit2 className="w-[14px] h-[14px]"/>
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setDeletingId(d.id!); }}
                                   className="text-[var(--text-tertiary)] hover:text-[#E05252] transition"
                                 >
                                   <Trash2 className="w-[14px] h-[14px]"/>
                                 </button>
                               </div>
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
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="Manobra">Manobra</option>
              <option value="Avulso">Avulso</option>
              <option value="Regional">Regional</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Início (HH:MM)</label>
              <input
                type="time"
                required
                value={inicio}
                onChange={e => setInicio(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Fim (HH:MM)</label>
              <input
                type="time"
                required
                value={fim}
                onChange={e => setFim(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
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
              <option value="Folga">Folga</option>
              <option value="Férias">Férias</option>
              <option value="Afastado">Afastado</option>
            </select>
          </div>

          <div className="relative border-b-0">
            <label className="block text-[10px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase mb-1">Veículo Padrão (Opcional)</label>
            <div className="relative">
               <input
                 type="text"
                 value={vehicleSearchDisplay}
                 placeholder="Digite a placa..."
                 className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] uppercase focus:outline-none focus:border-[var(--accent)] font-mono tracking-widest"
                 onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setVehicleSearchDisplay(val);
                    setVehicleDropdownOpen(true);
                    if (!val) setVeiculoPadraoId('');
                 }}
                 onFocus={() => setVehicleDropdownOpen(true)}
               />
               {vehicleDropdownOpen && vehicleSearchDisplay && (
                  <div className="absolute z-50 mt-1 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
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
                              className="text-left px-4 py-2 hover:bg-[var(--bg-base)] border-b border-[var(--border)] last:border-0 text-[var(--text-primary)] font-mono text-sm"
                           >
                              {v.placa} <span className="text-[var(--text-tertiary)] text-xs font-sans mx-2 uppercase">({v.tipo})</span>
                           </button>
                        ))
                     }
                     {vehicles.filter(v => v.placa === vehicleSearchDisplay).length === 0 && vehicleSearchDisplay.length > 5 && (
                        <div className="px-4 py-3 bg-[var(--bg-base)]">
                           <p className="text-xs text-[var(--text-secondary)] mb-2">Placa não encontrada.</p>
                           <button
                              type="button"
                              onClick={() => {
                                handleQuickCreateVehicle(vehicleSearchDisplay);
                              }}
                              className="text-xs font-semibold text-[var(--text-primary)] hover:underline"
                           >
                              Cadastrar placa {vehicleSearchDisplay}?
                           </button>
                        </div>
                     )}
                     <div className="px-4 py-2 bg-[var(--bg-base)] text-xs text-[var(--text-tertiary)] flex justify-end border-t border-[var(--border)]">
                       <button type="button" onClick={() => setVehicleDropdownOpen(false)} className="hover:text-[var(--text-primary)]">Fechar lista</button>
                     </div>
                  </div>
               )}
            </div>
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
        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-40 bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-4 py-2 rounded-lg flex items-center gap-4 shadow-high"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-[var(--border-subtle)]">
              <span className="w-5 h-5 bg-[var(--accent-main)] text-[var(--bg-elevated)] rounded flex items-center justify-center text-xs font-mono font-bold">
                {selectedIds.size}
              </span>
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                {selectedIds.size === 1 ? 'Motorista selecionado' : 'Motoristas selecionados'}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={() => setIsDeleteSelectedModalOpen(true)}
                className="text-[13px] font-medium text-red-600 hover:bg-red-500/10 px-3 py-1.5 rounded transition-colors"
                title="Excluir selecionados"
              >
                Excluir
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="w-7 h-7 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors ml-1"
                title="Limpar seleção"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
      )}

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

    </div>
  );
}
