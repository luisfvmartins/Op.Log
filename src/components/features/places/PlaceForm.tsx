import { useState, useEffect } from 'react';
import { Place } from '../../../services/places';
import { capitalizeText } from '../../../lib/formatter';

interface PlaceFormProps {
  initialData?: Place;
  onSubmit: (data: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlaceForm({ initialData, onSubmit, onCancel, isLoading }: PlaceFormProps) {
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    cidade: '',
    nomeRazaoSocial: '',
    linkGoogleMaps: '',
    observacao: ''
  });

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
    
    if (name === 'linkGoogleMaps') {
      formattedValue = value.toLowerCase();
    } else {
      formattedValue = capitalizeText(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Ex: CD Magalu"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cidade *</label>
        <input
          required
          name="cidade"
          value={formData.cidade}
          onChange={handleChange}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          placeholder="Ex: São Paulo, SP"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Razão Social / Nome completo *</label>
        <input
          required
          name="nomeRazaoSocial"
          value={formData.nomeRazaoSocial}
          onChange={handleChange}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
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
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
          placeholder="Insumos, restrições, horários..."
        />
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors border border-transparent"
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
