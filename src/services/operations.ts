import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface OperationLog {
  id?: string;
  userId: string;
  type: 'note' | 'task' | 'planning';
  title?: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  category?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  driverId?: string;
  vehicleId?: string;
  driverRef?: string;
  vehicleRef?: string;
  placeId?: string;
  color?: string;
  isPinned?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const getOperations = async (userId: string): Promise<OperationLog[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, 'operations'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OperationLog));
  return data.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const createOperation = async (operation: Omit<OperationLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newRef = doc(collection(db, 'operations'));
  await setDoc(newRef, {
    ...operation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newRef.id;
};

export const updateOperation = async (id: string, updates: Partial<OperationLog>): Promise<void> => {
  const ref = doc(db, 'operations', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteOperation = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'operations', id));
};
