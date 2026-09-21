import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CategoryWithShows, ShowDetail } from '../types';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Carga el catálogo completo de Home con una sola llamada RPC
 * (get_home_catalog), evitando N+1 queries (una por carrusel).
 */
export function useHomeCatalog() {
  const [state, setState] = useState<AsyncState<CategoryWithShows[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchCatalog = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.rpc('get_home_catalog');

    if (error) {
      setState({ data: null, loading: false, error: error.message });
      return;
    }

    // La función devuelve todas las categorías; ocultamos las vacías.
    const categories = ((data ?? []) as CategoryWithShows[]).filter(
      (c) => c.shows.length > 0
    );
    setState({ data: categories, loading: false, error: null });
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { ...state, refetch: fetchCatalog };
}

/**
 * Carga el detalle de un show y sus capítulos ordenados,
 * usando el join anidado de supabase-js (una sola query).
 */
export function useShowDetail(showId: number) {
  const [state, setState] = useState<AsyncState<ShowDetail>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchShow = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase
      .from('shows')
      .select(
        'id, title, synopsis, poster_url, year, episodes(id, episode_number, title, duration_minutes)'
      )
      .eq('id', showId)
      .order('episode_number', { referencedTable: 'episodes', ascending: true })
      .single();

    if (error) {
      setState({ data: null, loading: false, error: error.message });
      return;
    }

    setState({ data: data as ShowDetail, loading: false, error: null });
  }, [showId]);

  useEffect(() => {
    fetchShow();
  }, [fetchShow]);

  return { ...state, refetch: fetchShow };
}
