import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type ActionType = 'Inclusão' | 'Edição' | 'Exclusão' | 'Criação de Roteiro' | 'Importação' | 'Outro';
export type LogModule = 'Locais' | 'Roteiros' | 'Programações' | 'Motoristas' | 'Veículos' | 'Anotações' | 'Sistema';

export interface SystemLog {
  id: string;
  timestamp: string; // ISO 8601 string
  formattedDate: string; // e.g., "23/07/2026 15:26:05"
  actionType: ActionType;
  module: LogModule;
  description: string;
  details?: string;
  userEmail?: string;
  userId?: string;
}

const LOCAL_STORAGE_KEY = 'oplog_system_logs';
const MAX_LOGS = 1000;

function formatFullDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

const getLocalLogs = (): SystemLog[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse local system logs:', err);
    return [];
  }
};

const setLocalLogs = (logs: SystemLog[]) => {
  try {
    // Maintain maximum of 1000 logs
    const trimmed = logs.slice(0, MAX_LOGS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save local system logs:', err);
  }
};

/**
  Registers a new system log entry.
  Strictly read-only for users once created.
 */
export async function addSystemLog(params: {
  actionType: ActionType;
  module: LogModule;
  description: string;
  details?: string;
  userEmail?: string;
  userId?: string;
}): Promise<void> {
  const now = new Date();
  const formattedDate = formatFullDateTime(now);
  const isoTimestamp = now.toISOString();
  const logId = crypto.randomUUID();

  const newLog: SystemLog = {
    id: logId,
    timestamp: isoTimestamp,
    formattedDate,
    actionType: params.actionType,
    module: params.module,
    description: params.description,
    details: params.details || '',
    userEmail: params.userEmail || '',
    userId: params.userId || ''
  };

  // Always save to LocalStorage (newest first)
  const currentLogs = getLocalLogs();
  const updatedLogs = [newLog, ...currentLogs].slice(0, MAX_LOGS);
  setLocalLogs(updatedLogs);

  // If Firebase Firestore is active, push to logs collection asynchronously
  if (db) {
    try {
      await addDoc(collection(db, 'logs_sistema'), {
        ...newLog,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Could not persist log to Firestore:', err);
    }
  }
}

/**
  Retrieves the latest logs (up to 1000 entries).
 */
export async function getSystemLogs(userId?: string): Promise<SystemLog[]> {
  if (!db) {
    const logs = getLocalLogs();
    if (userId) {
      return logs.filter(l => !l.userId || l.userId === userId).slice(0, MAX_LOGS);
    }
    return logs.slice(0, MAX_LOGS);
  }

  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'logs_sistema'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(MAX_LOGS)
      );
    } else {
      q = query(
        collection(db, 'logs_sistema'),
        orderBy('createdAt', 'desc'),
        limit(MAX_LOGS)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return getLocalLogs().slice(0, MAX_LOGS);
    }

    const docs = snapshot.docs.map(doc => {
      const data = doc.data();
      let formattedDate = data.formattedDate;
      if (!formattedDate && data.createdAt?.toDate) {
        formattedDate = formatFullDateTime(data.createdAt.toDate());
      }
      return {
        id: doc.id,
        timestamp: data.timestamp || new Date().toISOString(),
        formattedDate: formattedDate || formatFullDateTime(new Date()),
        actionType: data.actionType || 'Outro',
        module: data.module || 'Sistema',
        description: data.description || '',
        details: data.details || '',
        userEmail: data.userEmail || '',
        userId: data.userId || ''
      } as SystemLog;
    });

    return docs.slice(0, MAX_LOGS);
  } catch (err) {
    console.warn('Failed to load logs from Firestore, using local logs:', err);
    return getLocalLogs().slice(0, MAX_LOGS);
  }
}
