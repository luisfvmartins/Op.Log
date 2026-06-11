import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, Upload, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, Vehicle } from '../services/vehicles';
import { getDrivers, createDriver } from '../services/drivers';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function VehiclesPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Form State
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Trucado');
  const [status, setStatus] = useState('Disponível');

  useEffect(() => {
    if (user?.uid) {
      loadVehicles();
    }
  }, [user]);

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

  const filteredVehicles = vehicles.filter(v => 
    v.placa.includes(searchQuery.toUpperCase()) ||
    v.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        const json = JSON.parse(content);
        let importedM = 0;
        let importedV = 0;
        
        setIsBusy(true);

        const listV = json.veiculos || (Array.isArray(json) ? json : []);
        for (const item of listV) {
          if (item.placa && !vehicles.find(v => v.placa === item.placa)) {
            await createVehicle({
              userId: user.uid,
              placa: formatPlate(item.placa),
              tipo: item.tipo || 'Trucado',
              status: item.status || 'Disponível'
            });
            importedV++;
          }
        }

        if (json.motoristas && Array.isArray(json.motoristas)) {
          const existingM = await getDrivers(user.uid);
          for (const item of json.motoristas) {
            if (item.nome && !existingM.find(d => d.nome === item.nome)) {
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
        }

        if (importedM > 0 || importedV > 0) {
          addToast(`Importado: ${importedM} motoristas, ${importedV} veículos`, 'success');
          loadVehicles();
        } else {
          addToast('Nenhum registro novo encontrado', 'info');
        }
      } catch (err) {
        addToast('Erro ao importar arquivo', 'error');
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Veículos</h1>
            <p className="text-slate-500 text-sm">Gerencie a frota de cavalos mecânicos.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => document.getElementById('import-file-vehicles')?.click()}
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
              <span className="font-medium text-sm">Novo Veículo</span>
            </button>
          </div>
          <input type="file" id="import-file-vehicles" accept=".json" onChange={handleImport} className="hidden" />
        </div>

        {/* Dashboard Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{vehicles.length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Disponíveis</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{vehicles.filter(v => v.status === 'Disponível').length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Programados</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{vehicles.filter(v => v.status === 'Programado').length}</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium uppercase">Manutenção</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{vehicles.filter(v => v.status === 'Manutenção').length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar veículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-10 pr-4 py-2 rounded-lg text-slate-900 dark:text-white uppercase"
          />
        </div>

        {/* List / Cards */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
             <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 dark:text-slate-400">Nenhum veículo encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(v => (
              <div key={v.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500/50 transition flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
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

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenModal(v)} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeletingId(v.id!)} 
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
        )}
      </div>

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
        message="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
