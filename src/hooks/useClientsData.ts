import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  client_code: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  job_title: string;
  how_did_you_find_us: string;
  active: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientWithMembership extends Client {
  membership?: {
    plan_name: string;
    discount_percentage: number;
    is_active: boolean;
  };
}

export const useClientsData = () => {
  const [clients, setClients] = useState<ClientWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientsData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients with their memberships (using LEFT JOIN to include all clients)
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_memberships(
            plan_name,
            discount_percentage,
            is_active
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedData: ClientWithMembership[] = (data || []).map(client => ({
        ...client,
        membership: client.client_memberships?.[0] || undefined
      }));

      setClients(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsData();
  }, []);

  const getActiveClientsCount = () => {
    return clients.filter(client => client.active).length;
  };

  const getTotalClientsCount = () => {
    return clients.length;
  };

  const getLeadSources = () => {
    const sources: Record<string, number> = {};
    clients.forEach(client => {
      const source = client.how_did_you_find_us;
      sources[source] = (sources[source] || 0) + 1;
    });
    
    const total = clients.length;
    return Object.entries(sources).map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  const getRecentClients = (limit = 10) => {
    return clients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  const getClientsByStatus = () => {
    return {
      active: clients.filter(client => client.active).length,
      inactive: clients.filter(client => !client.active).length,
      withMembership: clients.filter(client => client.membership?.is_active).length
    };
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClientsData,
    getActiveClientsCount,
    getTotalClientsCount,
    getLeadSources,
    getRecentClients,
    getClientsByStatus
  };
};