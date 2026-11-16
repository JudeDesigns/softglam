import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { request } from '@/api/client';
import { LOOK_SECTIONS, type LookSection, type MakeupLook } from '@/try-on/looks';

/**
 * The look catalog, managed by admins in the dashboard (GET /looks/sections).
 * Starts from the bundled catalog so the app works offline and on first
 * launch, then replaces it with the server's copy and caches that.
 */

interface ApiLook {
  id: string;
  name: string;
  caption: string;
  finish: MakeupLook['finish'];
  shades: MakeupLook['shades'];
  preview_image_url: string | null;
}

interface ApiLookSection {
  id: string;
  title: string;
  subtitle: string;
  looks: ApiLook[];
}

interface LookCatalogState {
  sections: LookSection[];
  isLoading: boolean;
  fetch: () => Promise<void>;
}

function fromApi(sections: ApiLookSection[]): LookSection[] {
  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    looks: s.looks.map((l) => ({
      id: l.id,
      name: l.name,
      caption: l.caption,
      finish: l.finish,
      shades: l.shades,
      previewImageUrl: l.preview_image_url ?? undefined,
    })),
  }));
}

export const useLookCatalog = create<LookCatalogState>()(
  persist(
    (set) => ({
      sections: LOOK_SECTIONS,
      isLoading: false,
      fetch: async () => {
        set({ isLoading: true });
        try {
          const rows = await request<ApiLookSection[]>('/looks/sections', { auth: false });
          // Keep the bundled catalog if the server has none configured yet.
          set({ sections: rows.length > 0 ? fromApi(rows) : LOOK_SECTIONS, isLoading: false });
        } catch {
          // Offline: keep showing the cached catalog.
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'softglow.look-catalog.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ sections: s.sections }),
    },
  ),
);

export function findLookIn(sections: LookSection[], id: string): MakeupLook | undefined {
  for (const section of sections) {
    const found = section.looks.find((l) => l.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Reactive lookup: re-renders when the catalog refreshes. */
export function useLook(id: string | undefined): MakeupLook | undefined {
  return useLookCatalog((s) => (id ? findLookIn(s.sections, id) : undefined));
}

export function useLookSections(): LookSection[] {
  return useLookCatalog((s) => s.sections);
}
