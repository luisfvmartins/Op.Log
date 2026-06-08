import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Place {
  id?: string;
  nomeFantasia: string;
  cidade: string;
  nomeRazaoSocial: string;
  linkGoogleMaps: string;
  observacao?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION = 'pontos_de_parada';

export async function getPlaces(): Promise<Place[]> {
  if (!db) {
    console.warn('Firebase is not configured. Falling back to empty lists.');
    return [];
  }
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Place));
  } catch (err) {
    console.error('Error fetching places:', err);
    return [];
  }
}

export async function createPlace(place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>): Promise<Place> {
  if (!db) throw new Error('O Firebase não foi configurado. Preencha as credenciais no painel lateral de Secrets (Settings).');
  
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...place,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return { id: docRef.id, ...place };
}

export async function updatePlace(id: string, place: Partial<Place>): Promise<void> {
  if (!db) throw new Error('O Firebase não foi configurado. Preencha as credenciais no painel lateral de Secrets.');
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, { ...place, updatedAt: serverTimestamp() });
}

export async function deletePlace(id: string): Promise<void> {
  if (!db) throw new Error('O Firebase não foi configurado. Preencha as credenciais no painel lateral.');
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}
