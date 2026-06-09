import { useState, useEffect } from 'react';
import { Place } from '../../../services/places';
import { capitalizeText } from '../../../lib/formatter';
import { getCidadesBrasileiras } from '../../../services/ibge';

interface PlaceFormProps {
  initialData?: Place;
  onSubmit: (data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlaceForm({ initialData, onSubmit, onCancel, isLoading }: PlaceFormProps) {
  const [cidadesReais, setCidadesReais] = useState<string[]>([]);
  const [cidadeError, setCidadeError] = useState('');
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    cidade: '',
    nomeRazaoSocial: '',
    linkGoogleMaps: '',
    observacao: ''
  });

  useEffect(() => {
    getCidadesBrasileiras().then(setCidadesReais);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomeFantasia: initialData.nomeFantasia || '',
        cidade: initialData.cidade || '',
        nomeRazaoSocial: initialData.nomeRazaoSocial || '',
        linkGoogleMaps: initialData.linkGoogleMaps || '',
        observacao: initialData.observacao || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Check if the change came from a paste action
    const nativeEvent = e.nativeEvent as InputEvent;
    const isPaste = nativeEvent.inputType && nativeEvent.inputType.includes('Paste');
    
    if (name === 'linkGoogleMaps') {
      formattedValue = value.toLowerCase();
    } else if (name === 'cidade') {
      // Don't auto-capitalize when fetching from list, allow matching exactly
      formattedValue = value;
      setCidadeError('');
    } else {
      if (isPaste) {
        formattedValue = capitalizeText(value);
      } else {
        formattedValue = value;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cidadesReais.length > 0 && !cidadesReais.includes(formData.cidade)) {
      setCidadeError('Por favor, selecione uma cidade válida da lista (Cidade - UF).');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nome Fantasia *</label>
        <input
          autoFocus
          required
          name="nomeFantasia"
          value={formData.nomeFantasia}
          onChange={handleChange}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Ex: CD Magalu"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cidade *</label>
        <input
          required
          name="cidade"
          list="brazil-cities"
          value={formData.cidade}
          onChange={handleChange}
          className={`w-full bg-white dark:bg-black/40 border ${cidadeError ? 'border-red-500' : 'border-slate-300 dark:border-white/10'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
          placeholder="Ex: São Paulo - SP"
          autoComplete="off"
        />
        <datalist id="brazil-cities">
          {cidadesReais.map(c => <option key={c} value={c} />)}
        </datalist>
        {cidadeError && <p className="text-xs text-red-500 font-medium mt-1">{cidadeError}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Razão Social / Nome completo *</label>
        <input
          required
          name="nomeRazaoSocial"
          value={formData.nomeRazaoSocial}
          onChange={handleChange}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Magazine Luiza S/A"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Link Google Maps *</label>
        <input
          required
          type="url"
          name="linkGoogleMaps"
          value={formData.linkGoogleMaps}
          onChange={handleChange}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
          placeholder="https://maps.app.goo.gl/..."
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Observação</label>
        <textarea
          name="observacao"
          value={formData.observacao}
          onChange={handleChange}
          rows={3}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
          placeholder="Insumos, restrições, horários..."
        />
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50"
        >
          {isLoading ? 'Salvando...' : 'Salvar Local'}
        </button>
      </div>
    </form>
  );
}
