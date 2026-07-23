import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addSystemLog } from './activityLog';

export interface Observacao {
  categoria: string;
  texto: string;
}

export interface Place {
  id?: string;
  nomeFantasia: string;
  cidade: string;
  nomeRazaoSocial: string;
  linkGoogleMaps: string;
  observacao?: string; // legacy or general observation
  observacoes?: Observacao[];
  tags?: string[]; // tags to classify points
  isFavorite?: boolean;
  routeCount?: number;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}


const COLLECTION = 'pontos_de_parada';

const getLocalPlaces = (): Place[] => JSON.parse(localStorage.getItem(COLLECTION) || '[]');
const setLocalPlaces = (places: Place[]) => localStorage.setItem(COLLECTION, JSON.stringify(places));

export async function getPlaces(userId: string): Promise<Place[]> {
  if (!userId) return [];
  if (!db) {
    console.warn('Firebase is not configured. Falling back to local storage.');
    return getLocalPlaces().filter(p => p.userId === userId);
  }
  try {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Place));
    return docs.sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (err) {
    console.error('Error fetching places:', err);
    return [];
  }
}

export async function createPlace(place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Place> {
  let created: Place;
  if (!db) {
    const newPlace: Place = { 
      ...place, 
      id: crypto.randomUUID(), 
      userId, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalPlaces([newPlace, ...getLocalPlaces()]);
    created = newPlace;
  } else {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...place,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    created = { id: docRef.id, ...place, userId };
  }

  addSystemLog({
    actionType: 'Inclusão',
    module: 'Locais',
    description: `Inclusão do local: ${place.nomeFantasia}`,
    details: `Cidade: ${place.cidade || 'N/A'} | Razão Social: ${place.nomeRazaoSocial || 'N/A'}`,
    userId
  });

  return created;
}

export async function updatePlace(id: string, place: Partial<Place>): Promise<void> {
  if (!db) {
    const places = getLocalPlaces();
    const updated = places.map(p => {
      if (p.id === id) {
        const newP = { ...p, ...place, updatedAt: new Date().toISOString() };
        if (place.observacoes !== undefined) {
          delete newP.observacao;
        }
        return newP;
      }
      return p;
    });
    setLocalPlaces(updated);
  } else {
    const docRef = doc(db, COLLECTION, id);
    const updateData: any = { ...place, updatedAt: serverTimestamp() };
    if (place.observacoes !== undefined) {
      updateData.observacao = deleteField();
    }
    await updateDoc(docRef, updateData);
  }

  addSystemLog({
    actionType: 'Edição',
    module: 'Locais',
    description: `Edição do local: ${place.nomeFantasia || id}`,
    details: place.cidade ? `Cidade: ${place.cidade}` : undefined
  });
}

export async function deletePlace(id: string): Promise<void> {
  if (!db) {
    setLocalPlaces(getLocalPlaces().filter(p => p.id !== id));
  } else {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  }

  addSystemLog({
    actionType: 'Exclusão',
    module: 'Locais',
    description: `Exclusão do local ID: ${id}`
  });
}

export async function deletePlaces(ids: string[]): Promise<void> {
  if (!db) {
    setLocalPlaces(getLocalPlaces().filter(p => !ids.includes(p.id!)));
  } else {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      
      chunk.forEach(id => {
        batch.delete(doc(db, COLLECTION, id));
      });
      
      await batch.commit();
    }
  }

  addSystemLog({
    actionType: 'Exclusão',
    module: 'Locais',
    description: `Exclusão em massa: ${ids.length} local(is) removido(s)`
  });
}

export async function deleteAllPlaces(userId?: string): Promise<void> {
  if (!db) {
    setLocalPlaces([]);
  } else {
    if (!userId) {
      throw new Error('UserId required for deleting all places');
    }

    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const CHUNK_SIZE = 450;
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        
        chunk.forEach(d => {
          batch.delete(d.ref);
        });
        
        await batch.commit();
      }
    }
  }

  addSystemLog({
    actionType: 'Exclusão',
    module: 'Locais',
    description: `Exclusão total: todos os locais foram limpos`,
    userId
  });
}

export async function importData(places: Omit<Place, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[], userId: string): Promise<void> {
  if (!db) {
    const current = getLocalPlaces();
    const newPlaces = places.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setLocalPlaces([...newPlaces, ...current]);
  } else {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < places.length; i += CHUNK_SIZE) {
      const chunk = places.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      
      chunk.forEach(place => {
        const docRef = doc(collection(db, COLLECTION));
        batch.set(docRef, {
          ...place,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    }
  }

  addSystemLog({
    actionType: 'Importação',
    module: 'Locais',
    description: `Importação de dados: ${places.length} locais cadastrados`,
    userId
  });
}
