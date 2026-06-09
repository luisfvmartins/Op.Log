import { useState, useEffect, useCallback } from 'react';
import { Place, getPlaces, createPlace, updatePlace, deletePlace, importData as importPlaces } from '../services/places';
import { useAuth } from '../contexts/AuthContext';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPlaces = useCallback(async () => {
    if (!user) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getPlaces(user.uid);
      setPlaces(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar locais');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const add = async (place: Omit<Place, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    const newPlace = await createPlace(place, user.uid);
    setPlaces(prev => [newPlace, ...prev]);
    return newPlace;
  };

  const update = async (id: string, place: Partial<Place>) => {
    if (!user) throw new Error('Usuário não autenticado');
    await updatePlace(id, place);
    setPlaces(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPlace = { ...p, ...place };
        if (place.observacoes !== undefined) {
          delete updatedPlace.observacao;
          delete updatedPlace.tags;
        }
        return updatedPlace;
      }
      return p;
    }));
  };

  const remove = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    await deletePlace(id);
    setPlaces(prev => prev.filter(p => p.id !== id));
  };

  const removeAll = async () => {
    if (!user) throw new Error('Usuário não autenticado');
    await import('../services/places').then(m => m.deleteAllPlaces(user.uid));
    setPlaces([]);
  };

  const importData = async (data: any[]) => {
    if (!user) throw new Error('Usuário não autenticado');
    await importPlaces(data, user.uid);
    await fetchPlaces();
  };

  return { places, loading, error, add, update, remove, removeAll, importData, refetch: fetchPlaces };
}
