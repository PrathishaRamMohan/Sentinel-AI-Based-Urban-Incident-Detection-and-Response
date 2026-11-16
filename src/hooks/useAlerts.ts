import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SystemAlert } from '@/types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const fetchAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Failed to load alerts:', error.message);
      return;
    }
    setAlerts(data as SystemAlert[]);
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Auto-sync polling every 3 seconds
    const pollInterval = setInterval(() => {
      fetchAlerts();
    }, 3000);

    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          setAlerts((prev) => {
            const exists = prev.some((a) => a.id === (payload.new as SystemAlert).id);
            if (exists) return prev;
            return [payload.new as SystemAlert, ...prev].slice(0, 50);
          });
        },
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  return { alerts, refetch: fetchAlerts };
}
