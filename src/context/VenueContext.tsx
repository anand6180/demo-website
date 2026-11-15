import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BootstrapPayload } from '../types/venue';
import { STATIC_FALLBACK_DATA } from '../data/staticFallback';

interface VenueContextValue {
  data: BootstrapPayload | null;
  loading: boolean;
  error: string | null;
  isStaticMode: boolean;
  refresh: () => Promise<void>;
}

const VenueContext = createContext<VenueContextValue>({
  data: null,
  loading: true,
  error: null,
  isStaticMode: false,
  refresh: async () => {},
});

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStaticMode, setIsStaticMode] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/public/bootstrap');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        setData(STATIC_FALLBACK_DATA);
        setIsStaticMode(true);
        return;
      }
      const json = (await res.json()) as BootstrapPayload;
      setData(json);
      setIsStaticMode(false);
    } catch {
      // Fall back cleanly when running on static hosting (e.g. GitHub Pages)
      setData(STATIC_FALLBACK_DATA);
      setIsStaticMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <VenueContext.Provider value={{ data, loading, error, isStaticMode, refresh }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  return useContext(VenueContext);
}
