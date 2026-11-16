import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Incident, IncidentStatus } from '@/types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load incidents:', error.message);
      return;
    }
    setIncidents(data as Incident[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIncidents();

    // Auto-sync polling every 3 seconds for guaranteed real-time updates
    const pollInterval = setInterval(() => {
      fetchIncidents();
    }, 3000);

    const channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          setIncidents((prev) => {
            const exists = prev.some((i) => i.id === (payload.new as Incident).id);
            if (exists) return prev;
            return [payload.new as Incident, ...prev];
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload) => {
          const updated = payload.new as Incident;
          setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'incidents' },
        (payload) => {
          setIncidents((prev) => prev.filter((i) => i.id !== (payload.old as Incident).id));
        },
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchIncidents]);

  const addIncident = useCallback(
    async (incident: {
      type: string;
      location_name: string;
      latitude: number;
      longitude: number;
      severity: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incident)
        .select()
        .single();
      if (error) throw error;
      return data as Incident;
    },
    [],
  );

  const updateStatus = useCallback(async (id: string, status: IncidentStatus) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'Dispatched' || status === 'En Route') {
      updates.dispatched_at = new Date().toISOString();
    }
    if (status === 'Resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('incidents').update(updates).eq('id', id);
    if (error) throw error;
  }, []);

  return { incidents, loading, addIncident, updateStatus, refetch: fetchIncidents };
}
