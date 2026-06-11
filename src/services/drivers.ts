import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface Driver {
  id?: string;
  userId: string;
  nome: string;
  tipo: string;
  inicioJornada: string; // e.g. "08:00"
  fimJornada: string;    // e.g. "18:00"
  status: string;        // "Disponível", "Programado", "Folga", "Férias", "Afastado"
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const getDrivers = async (userId: string): Promise<Driver[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, 'drivers'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
};

export const createDriver = async (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newRef = doc(collection(db, 'drivers'));
  await setDoc(newRef, {
    ...driver,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newRef.id;
};

export const updateDriver = async (id: string, updates: Partial<Driver>): Promise<void> => {
  const ref = doc(db, 'drivers', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteDriver = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'drivers', id));
};
