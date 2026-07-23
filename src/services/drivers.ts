import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addSystemLog } from './activityLog';

export interface Driver {
  id?: string;
  userId: string;
  nome: string;
  tipo: string;
  inicioJornada: string; // e.g. "08:00"
  fimJornada: string;    // e.g. "18:00"
  status: string;        // "Disponível", "Programado", "Folga", "Férias", "Afastado"
  veiculoPadraoId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const getDrivers = async (userId: string): Promise<Driver[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, 'drivers'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
  return data.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const createDriver = async (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newRef = doc(collection(db, 'drivers'));
  await setDoc(newRef, {
    ...driver,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  addSystemLog({
    actionType: 'Inclusão',
    module: 'Motoristas',
    description: `Inclusão de motorista: ${driver.nome}`,
    details: `Tipo: ${driver.tipo} | Status: ${driver.status}`,
    userId: driver.userId
  });

  return newRef.id;
};

export const updateDriver = async (id: string, updates: Partial<Driver>): Promise<void> => {
  const ref = doc(db, 'drivers', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });

  addSystemLog({
    actionType: 'Edição',
    module: 'Motoristas',
    description: `Edição de motorista: ${updates.nome || id}`,
    details: updates.status ? `Status: ${updates.status}` : undefined,
    userId: updates.userId
  });
};

export const deleteDriver = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'drivers', id));

  addSystemLog({
    actionType: 'Exclusão',
    module: 'Motoristas',
    description: `Exclusão de motorista ID: ${id}`
  });
};
