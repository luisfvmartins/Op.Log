import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Category {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Insumos' },
  { id: '2', name: 'Bairro' },
  { id: '3', name: 'Unidade' },
  { id: '4', name: 'Informativo' },
  { id: '5', name: 'Segurança' },
  { id: '6', name: 'EPI' },
];

const LOCAL_KEY = 'roter_categories';

export async function getCategories(userId: string): Promise<Category[]> {
  if (!userId) return DEFAULT_CATEGORIES;
  
  if (!db) {
    const localStr = localStorage.getItem(LOCAL_KEY);
    if (!localStr) return DEFAULT_CATEGORIES;
    try {
      const parsed = JSON.parse(localStr);
      if (parsed[userId]) return parsed[userId];
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  try {
    const docRef = doc(db, 'user_categories', userId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().items) {
      return snap.data().items as Category[];
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
  
  return DEFAULT_CATEGORIES;
}

export async function saveCategories(userId: string, categories: Category[]): Promise<void> {
  if (!userId) return;

  if (!db) {
    const localStr = localStorage.getItem(LOCAL_KEY);
    let all = {};
    if (localStr) {
      try { all = JSON.parse(localStr); } catch {}
    }
    all[userId as keyof typeof all] = categories;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    return;
  }

  const docRef = doc(db, 'user_categories', userId);
  await setDoc(docRef, { items: categories });
}
