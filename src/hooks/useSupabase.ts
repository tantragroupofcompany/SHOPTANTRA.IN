import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useQuery<T>(
  tableName: string,
  options?: {
    select?: string;
    eq?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from(tableName).select(options?.select ?? '*');
    if (options?.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        query = query.eq(key, value as string);
      });
    }
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    const { data: result, error: err } = await query;
    if (err) setError(err.message);
    else setData((result as T[]) ?? []);
    setLoading(false);
  }, [tableName, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
