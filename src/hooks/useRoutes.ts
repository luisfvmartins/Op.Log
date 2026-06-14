import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RouteData } from '../services/routes';

export function useRoutes(userId: string | undefined) {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const q = query(collection(db, 'roteiros'), where('userId', '==', userId));
    getDocs(q).then(snap => {
      setRoutes(snap.docs.map(d => ({ id: d.id, ...d.data() } as RouteData)));
      setLoading(false);
    });
  }, [userId]);

  return { routes, loading };
}
