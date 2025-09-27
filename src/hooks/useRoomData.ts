import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoomItem {
  id: string;
  name: string;
  price: number;
  hourly_rate: number;
  category: 'room';
  can_make: boolean;
  description?: string;
}

export const useRoomData = () => {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;

      const roomItems: RoomItem[] = (data || []).map(room => ({
        id: room.id,
        name: room.name,
        price: room.hourly_rate,
        hourly_rate: room.hourly_rate,
        category: 'room' as const,
        can_make: room.is_available,
        description: room.description || undefined
      }));

      setRooms(roomItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms
  };
};