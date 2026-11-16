import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FeatureKey, FeatureSetting, Recipe } from '@/api/types';

/**
 * Looks the client started but hasn't sent to an artist yet, so they can pick
 * up where they left off from "My looks". Kept on the phone only.
 *
 * Only uploaded photos (relative `/media/...` paths) are stored: the camera's
 * local file URIs are temporary and may be gone when the draft is resumed.
 */

export type LookDraftKind = 'library' | 'copy';

export interface LookDraft {
  id: string;
  kind: LookDraftKind;
  /** e.g. the catalog look's name, or "Your copied look". */
  title: string;
  /** Library drafts: the catalog look id. */
  lookId?: string;
  selfieUrl?: string;
  /** AI preview, once generated. */
  previewUrl?: string;
  /** Copy drafts: uploaded inspiration photos (Look A, B, C). */
  referenceUrls?: string[];
  /** Copy drafts: per-feature source + strength, and the overall strength. */
  settings?: Record<FeatureKey, FeatureSetting>;
  master?: number;
  /** Copy drafts: the recipe that produced `previewUrl`, and its check result. */
  previewRecipe?: Recipe;
  previewPassed?: boolean;
  previewIssues?: string[];
  artistId?: string;
  message?: string;
  updatedAt: string;
}

interface LookDraftsState {
  drafts: LookDraft[];
  /** Insert or merge by id; bumps updatedAt. */
  save: (draft: Omit<LookDraft, 'updatedAt'>) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const libraryDraftId = (lookId: string) => `library:${lookId}`;

export function newCopyDraftId(): string {
  return `copy:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** A draft worth showing: it has at least one uploaded photo. */
export function isMeaningful(d: LookDraft): boolean {
  return !!(d.selfieUrl || d.previewUrl || (d.referenceUrls && d.referenceUrls.length > 0));
}

export const useLookDrafts = create<LookDraftsState>()(
  persist(
    (set) => ({
      drafts: [],
      save: (draft) =>
        set((s) => {
          const existing = s.drafts.find((d) => d.id === draft.id);
          const next: LookDraft = { ...existing, ...draft, updatedAt: new Date().toISOString() };
          const others = s.drafts.filter((d) => d.id !== draft.id);
          return { drafts: [next, ...others] };
        }),
      remove: (id) => set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),
      reset: () => set({ drafts: [] }),
    }),
    {
      name: 'softglow.look-drafts.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Drafts that have something to resume, newest first. */
export function useOpenDrafts(): LookDraft[] {
  return useLookDrafts((s) => s.drafts).filter(isMeaningful);
}
