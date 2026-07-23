import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Place } from './places';
import { addSystemLog } from './activityLog';

export interface RouteStop extends Place {
  operacao?: string;
  agendamento?: string;
}

export interface RouteData {
  id?: string;
  carreta?: string; // backwards compatibility
  placa?: string;
  placa2?: string;
  operacaoGeral?: string;
  agendamentoGeral?: string;
  observacaoGeral?: string;
  destinos: RouteStop[] | Place[];
  mensagemGerada: string;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION = 'roteiros';


const getLocalRoutes = (): RouteData[] => JSON.parse(localStorage.getItem(COLLECTION) || '[]');
const setLocalRoutes = (routes: RouteData[]) => localStorage.setItem(COLLECTION, JSON.stringify(routes));

export async function createRoute(route: Omit<RouteData, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
  let routeId: string;
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
    routeId = id;
  } else {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...route,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    routeId = docRef.id;
  }

  const destCount = route.destinos?.length || 0;
  const plateText = route.placa ? `Placa: ${route.placa}${route.placa2 ? ' / ' + route.placa2 : ''}` : 'Sem placa';

  addSystemLog({
    actionType: 'Criação de Roteiro',
    module: 'Roteiros',
    description: `Criação de Roteiro (${route.operacaoGeral || 'Geral'}): ${destCount} destino(s)`,
    details: `${plateText} | Observação: ${route.observacaoGeral || 'Nenhuma'}`,
    userId
  });

  return routeId;
}
