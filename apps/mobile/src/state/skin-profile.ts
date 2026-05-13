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

/**
 * Frontend-phase persistence. Replaced by API-backed storage in phase 2 —
 * the shape of `profile` already matches the eventual server payload.
 */

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

  setDraftConcernSeverity: (concern: SkinConcern, severity: SeverityLevel) => void;
  setDraftTone: (tier: SkinToneTier) => void;
  setDraftType: (type: SkinType) => void;

  addZoneTag: (tag: FaceZoneTag) => void;
  updateZoneTag: (id: string, concerns: SkinConcern[]) => void;
  removeZoneTag: (id: string) => void;

  /** Compute the score from the current draft and commit it as the profile. */
  commitDraft: () => SkinProfile | null;
  resetDraft: () => void;

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

export const useSkinProfile = create<SkinProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      draft: emptyDraft,
      onboardingSkipped: false,

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

      commitDraft: () => {
        const { draft } = get();
        if (draft.toneTier === null || draft.type === null) {
          return null;
        }
        const profile: SkinProfile = {
          toneTier: draft.toneTier,
          type: draft.type,
          concerns: draft.concerns,
          zoneTags: draft.zoneTags,
          healthScore: computeHealthScore(draft.concerns),
          capturedAt: new Date().toISOString(),
        };
        set({ profile, onboardingSkipped: false });
        return profile;
      },

      resetDraft: () => set({ draft: emptyDraft }),

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
