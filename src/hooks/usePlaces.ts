import { useState, useEffect, useCallback } from 'react';
import { Place, getPlaces, createPlace, updatePlace, deletePlace } from '../services/places';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlaces();
      setPlaces(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar locais');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const add = async (place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlace = await createPlace(place);
    setPlaces(prev => [newPlace, ...prev]);
    return newPlace;
  };

  const update = async (id: string, place: Partial<Place>) => {
    await updatePlace(id, place);
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...place } : p));
  };

  const remove = async (id: string) => {
    await deletePlace(id);
    setPlaces(prev => prev.filter(p => p.id !== id));
  };

  return { places, loading, error, add, update, remove, refetch: fetchPlaces };
}
