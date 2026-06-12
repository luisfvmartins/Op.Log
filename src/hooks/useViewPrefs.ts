import { useState, useEffect } from 'react';

export function useViewPrefs(pageKey: string, defaultView: 'list' | 'grid' = 'grid', defaultSort = 'recentes') {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem(`viewMode_${pageKey}`);
    return (saved as 'list' | 'grid') || defaultView;
  });
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem(`sortBy_${pageKey}`);
    return saved || defaultSort;
  });

  useEffect(() => {
    localStorage.setItem(`viewMode_${pageKey}`, viewMode);
  }, [viewMode, pageKey]);

  useEffect(() => {
    localStorage.setItem(`sortBy_${pageKey}`, sortBy);
  }, [sortBy, pageKey]);

  return { viewMode, setViewMode, sortBy, setSortBy };
}
