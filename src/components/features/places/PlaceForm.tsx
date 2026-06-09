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
    endereco: '',
    nomeRazaoSocial: '',
    linkGoogleMaps: '',
    observacao: '',
    tags: ''
  });

  useEffect(() => {
    getCidadesBrasileiras().then(setCidadesReais);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nomeFantasia: initialData.nomeFantasia || '',
        cidade: initialData.cidade || '',
        endereco: initialData.endereco || '',
        nomeRazaoSocial: initialData.nomeRazaoSocial || '',
        linkGoogleMaps: initialData.linkGoogleMaps || '',
        observacao: initialData.observacao || '',
        tags: initialData.tags?.join(', ') || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'linkGoogleMaps') {
      formattedValue = value.toLowerCase();
    } else if (name === 'cidade') {
      formattedValue = value;
      setCidadeError('');
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.currentTarget.name;
    if (name !== 'linkGoogleMaps' && name !== 'cidade') {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const formattedText = capitalizeText(pastedText);
      
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value;
      
      const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
      
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitData = { ...formData };
    
    if (cidadesReais.length > 0) {
      const typed = formData.cidade.trim().toLowerCase();
      let matchedCity = cidadesReais.find(c => c.toLowerCase() === typed);
      
      if (!matchedCity) {
        // Try matching without UF
        const exactNameMatches = cidadesReais.filter(c => c.split(' - ')[0].toLowerCase() === typed);
        if (exactNameMatches.length === 1) {
          matchedCity = exactNameMatches[0];
        } else if (exactNameMatches.length > 1) {
          setCidadeError('Há mais de uma cidade com este nome. Por favor, selecione (Cidade - UF) na lista.');
          return;
        }
      }

      if (!matchedCity) {
        setCidadeError('Por favor, selecione uma cidade válida da lista (Cidade - UF).');
        return;
      }
      
      submitData.cidade = matchedCity;
    }
    
    const finalTags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const { tags, ...restData } = submitData;
    
    await onSubmit({
      ...restData,
      tags: finalTags
    });
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
          onPaste={handlePaste}
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
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Endereço (Rua, Bairro, etc.)</label>
        <input
          name="endereco"
          value={formData.endereco}
          onChange={handleChange}
          onPaste={handlePaste}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Razão Social / Nome completo *</label>
        <input
          required
          name="nomeRazaoSocial"
          value={formData.nomeRazaoSocial}
          onChange={handleChange}
          onPaste={handlePaste}
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
          onPaste={handlePaste}
          rows={3}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
          placeholder="Insumos, restrições, horários..."
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tags (separadas por vírgula)</label>
        <input
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
          placeholder="Ex: Armazém, Fazenda"
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
