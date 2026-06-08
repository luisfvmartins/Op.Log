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

export async function createRoute(route: Omit<RouteData, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
  if (!db) throw new Error('Credenciais do Firebase não configuradas. Adicione as variáveis de ambiente baseadas no .env.example.');
  
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...route,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}
