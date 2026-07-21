import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  computeHealthScore,
  type FaceZoneTag,
  type SeverityLevel,
  type SkinConcern,
  type SkinProfile,
  type SkinToneTier,
  type SkinType,
} from '@softglow/types';
import { apiGetMySkinProfile, apiUpsertMySkinProfile } from '@/api/skin-profiles';

interface DraftProfile {
  toneTier: SkinToneTier | null;
  type: SkinType | null;
  concerns: Partial<Record<SkinConcern, SeverityLevel>>;
  zoneTags: FaceZoneTag[];
}

interface SkinProfileState {
  profile: SkinProfile | null;
  draft: DraftProfile;
  onboardingSkipped: boolean;
  isSyncing: boolean;

  setDraftConcernSeverity: (concern: SkinConcern, severity: SeverityLevel) => void;
  setDraftTone: (tier: SkinToneTier) => void;
  setDraftType: (type: SkinType) => void;

  addZoneTag: (tag: FaceZoneTag) => void;
  updateZoneTag: (id: string, concerns: SkinConcern[]) => void;
  removeZoneTag: (id: string) => void;

  /** Compute the score from the current draft, commit locally, and sync to API. */
  commitDraft: () => Promise<SkinProfile | null>;
  resetDraft: () => void;

  /** Pull the user's existing skin profile from the API (called after sign-in). */
  fetchFromApi: () => Promise<void>;

  skipOnboarding: () => void;
  resumeOnboarding: () => void;
  signOutReset: () => void;
}

const emptyDraft: DraftProfile = {
  toneTier: null,
  type: null,
  concerns: {},
  zoneTags: [],
};

function apiProfileToLocal(api: Awaited<ReturnType<typeof apiGetMySkinProfile>>): SkinProfile {
  return {
    toneTier: api.tone_tier,
    type: api.skin_type,
    concerns: api.concerns as Partial<Record<SkinConcern, SeverityLevel>>,
    zoneTags: api.zone_tags,
    healthScore: api.health_score,
    capturedAt: api.captured_at,
  };
}

export const useSkinProfile = create<SkinProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      draft: emptyDraft,
      onboardingSkipped: false,
      isSyncing: false,

      setDraftConcernSeverity: (concern, severity) =>
        set((state) => ({
          draft: {
            ...state.draft,
            concerns: { ...state.draft.concerns, [concern]: severity },
          },
        })),

      setDraftTone: (tier) =>
        set((state) => ({ draft: { ...state.draft, toneTier: tier } })),

      setDraftType: (type) =>
        set((state) => ({ draft: { ...state.draft, type } })),

      addZoneTag: (tag) =>
        set((state) => ({
          draft: { ...state.draft, zoneTags: [...state.draft.zoneTags, tag] },
        })),

      updateZoneTag: (id, concerns) =>
        set((state) => ({
          draft: {
            ...state.draft,
            zoneTags: state.draft.zoneTags.map((t) => (t.id === id ? { ...t, concerns } : t)),
          },
        })),

      removeZoneTag: (id) =>
        set((state) => ({
          draft: {
            ...state.draft,
            zoneTags: state.draft.zoneTags.filter((t) => t.id !== id),
          },
        })),

      commitDraft: async () => {
        const { draft } = get();
        if (draft.toneTier === null || draft.type === null) return null;

        const localProfile: SkinProfile = {
          toneTier: draft.toneTier,
          type: draft.type,
          concerns: draft.concerns,
          zoneTags: draft.zoneTags,
          healthScore: computeHealthScore(draft.concerns),
          capturedAt: new Date().toISOString(),
        };
        // Optimistic local commit.
        set({ profile: localProfile, onboardingSkipped: false, isSyncing: true });

        try {
          const apiProfile = await apiUpsertMySkinProfile({
            tone_tier: draft.toneTier,
            skin_type: draft.type,
            concerns: draft.concerns as Partial<Record<SkinConcern, number>>,
            zone_tags: draft.zoneTags,
          });
          const synced = apiProfileToLocal(apiProfile);
          set({ profile: synced, isSyncing: false });
          return synced;
        } catch {
          // Keep the local version if the API call fails — will re-sync on next commit.
          set({ isSyncing: false });
          return localProfile;
        }
      },

      resetDraft: () => set({ draft: emptyDraft }),

      fetchFromApi: async () => {
        try {
          const api = await apiGetMySkinProfile();
          set({ profile: apiProfileToLocal(api) });
        } catch {
          // 404 means no profile yet — that's fine.
        }
      },

      skipOnboarding: () => set({ onboardingSkipped: true }),
      resumeOnboarding: () => set({ onboardingSkipped: false }),

      signOutReset: () => set({ profile: null, draft: emptyDraft, onboardingSkipped: false }),
    }),
    {
      name: 'softglow.skin-profile.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        onboardingSkipped: state.onboardingSkipped,
      }),
    },
  ),
);
