import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Place } from './places';

export interface RouteData {
  id?: string;
  carreta: string;
  observacaoGeral?: string;
  destinos: Place[];
  mensagemGerada: string;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION = 'roteiros';

const getLocalRoutes = (): RouteData[] => JSON.parse(localStorage.getItem(COLLECTION) || '[]');
const setLocalRoutes = (routes: RouteData[]) => localStorage.setItem(COLLECTION, JSON.stringify(routes));

export async function createRoute(route: Omit<RouteData, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
  if (!db) {
    const id = crypto.randomUUID();
    const newRoute: RouteData = {
      ...route,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalRoutes([newRoute, ...getLocalRoutes()]);
    return id;
  }
  
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...route,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}
