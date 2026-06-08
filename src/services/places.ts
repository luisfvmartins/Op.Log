import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Place {
  id?: string;
  nomeFantasia: string;
  cidade: string;
  nomeRazaoSocial: string;
  linkGoogleMaps: string;
  observacao?: string;
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
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Place));
  } catch (err) {
    console.error('Error fetching places:', err);
    return [];
  }
}

export async function createPlace(place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Place> {
  if (!db) {
    const newPlace: Place = { 
      ...place, 
      id: crypto.randomUUID(), 
      userId, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalPlaces([newPlace, ...getLocalPlaces()]);
    return newPlace;
  }
  
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...place,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return { id: docRef.id, ...place, userId };
}

export async function updatePlace(id: string, place: Partial<Place>): Promise<void> {
  if (!db) {
    const places = getLocalPlaces();
    const updated = places.map(p => p.id === id ? { ...p, ...place, updatedAt: new Date().toISOString() } : p);
    setLocalPlaces(updated);
    return;
  }
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { ...place, updatedAt: serverTimestamp() });
}

export async function deletePlace(id: string): Promise<void> {
  if (!db) {
    setLocalPlaces(getLocalPlaces().filter(p => p.id !== id));
    return;
  }
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
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
    return;
  }
  const batch = writeBatch(db);
  
  places.forEach(place => {
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
