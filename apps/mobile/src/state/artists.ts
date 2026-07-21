import { create } from 'zustand';
import { apiListArtists } from '@/api/artists';
import type { ApiArtist } from '@/api/types';

/**
 * Client-side artist directory. Populated by GET /artists on first use.
 * Falls back to an empty array while loading; errors surface via `error`.
 */

interface ArtistState {
  artists: ApiArtist[];
  isLoading: boolean;
  error: string | null;
  /** Fetch the full artist list. No-ops if already loaded unless `force` is true. */
  fetch: (force?: boolean) => Promise<void>;
  findById: (id: string) => ApiArtist | undefined;
}

export const useArtists = create<ArtistState>((set, get) => ({
  artists: [],
  isLoading: false,
  error: null,

  fetch: async (force = false) => {
    const { artists, isLoading } = get();
    if (!force && (artists.length > 0 || isLoading)) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiListArtists();
      set({ artists: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load artists';
      set({ error: message, isLoading: false });
    }
  },

  findById: (id) => get().artists.find((a) => a.id === id),
}));
