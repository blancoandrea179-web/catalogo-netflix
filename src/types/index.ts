// Tipos de dominio compartidos por toda la app.

/** Show tal como aparece dentro de un carrusel en Home (datos mínimos). */
export interface ShowSummary {
  id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
}

/** Una categoría con sus shows, tal como la devuelve la función RPC get_home_catalog(). */
export interface CategoryWithShows {
  id: number;
  name: string;
  sort_order: number;
  shows: ShowSummary[];
}

/** Un capítulo de un show. */
export interface Episode {
  id: number;
  episode_number: number;
  title: string;
  duration_minutes: number | null;
}

/** Detalle completo de un show (pantalla de detalle). */
export interface ShowDetail {
  id: number;
  title: string;
  synopsis: string | null;
  poster_url: string | null;
  year: number | null;
  episodes: Episode[];
}
