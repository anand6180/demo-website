import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BootstrapPayload } from '../types/venue';

interface VenueContextValue {
  data: BootstrapPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const VenueContext = createContext<VenueContextValue>({
  data: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) {
        throw new Error('Unable to load venue configuration.');
      }
      const json = (await res.json()) as BootstrapPayload;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load venue data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <VenueContext.Provider value={{ data, loading, error, refresh }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  return useContext(VenueContext);
}
