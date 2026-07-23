import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addSystemLog } from './activityLog';

export interface Vehicle {
  id?: string;
  userId: string;
  placa: string;
  tipo: string; // "Simples", "Trucado", "Traçado"
  status: string; // "Disponível", "Programado", "Manutenção", "Inativo"
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const getVehicles = async (userId: string): Promise<Vehicle[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, 'vehicles'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
  return data.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const createVehicle = async (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newRef = doc(collection(db, 'vehicles'));
  await setDoc(newRef, {
    ...vehicle,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  addSystemLog({
    actionType: 'Inclusão',
    module: 'Veículos',
    description: `Inclusão de veículo: ${vehicle.placa}`,
    details: `Tipo: ${vehicle.tipo} | Status: ${vehicle.status}`,
    userId: vehicle.userId
  });

  return newRef.id;
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<void> => {
  const ref = doc(db, 'vehicles', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });

  addSystemLog({
    actionType: 'Edição',
    module: 'Veículos',
    description: `Edição de veículo: ${updates.placa || id}`,
    details: updates.status ? `Status: ${updates.status}` : undefined,
    userId: updates.userId
  });
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'vehicles', id));

  addSystemLog({
    actionType: 'Exclusão',
    module: 'Veículos',
    description: `Exclusão de veículo ID: ${id}`
  });
};
