import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addSystemLog } from './activityLog';

export interface Schedule {
  id?: string;
  userId: string;
  driverId: string;
  vehicleId: string;
  date: string;
  time: string;
  operation: string | string[]; // Backwards compatibility, use operations when possible
  operations?: string[];
  locationId?: string;
  locationName?: string;
  observations?: string;
  status: string; // "Ativo", "Encerrado"
  isFixed?: boolean;
  fixedGroupId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const getSchedules = async (userId: string): Promise<Schedule[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, 'schedules'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
  return data.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const createSchedule = async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newRef = doc(collection(db, 'schedules'));
  await setDoc(newRef, {
    ...schedule,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  addSystemLog({
    actionType: 'Inclusão',
    module: 'Programações',
    description: `Nova programação registrada para ${schedule.date} às ${schedule.time}`,
    details: `Local: ${schedule.locationName || 'N/A'} | Status: ${schedule.status}`,
    userId: schedule.userId
  });

  return newRef.id;
};

export const updateSchedule = async (id: string, updates: Partial<Schedule>): Promise<void> => {
  const ref = doc(db, 'schedules', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });

  addSystemLog({
    actionType: 'Edição',
    module: 'Programações',
    description: `Atualização de programação ID: ${id}`,
    details: updates.status ? `Status alterado para ${updates.status}` : undefined,
    userId: updates.userId
  });
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'schedules', id));

  addSystemLog({
    actionType: 'Exclusão',
    module: 'Programações',
    description: `Exclusão de programação ID: ${id}`
  });
};
