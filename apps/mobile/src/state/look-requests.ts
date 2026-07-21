import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  apiCreateLookRequest,
  apiDeclineLookRequest,
  apiListMyLookRequests,
  apiMarkLookRequestViewed,
  apiQuoteLookRequest,
} from '@/api/look-requests';
import type { ApiLookRequest } from '@/api/types';

/**
 * Look-share request lifecycle. Backed by the real API; local state is the
 * optimistic cache. sendRequest creates the record server-side and caches the
 * result. fetchFromApi re-hydrates from the server (called after sign-in).
 */

export type LookRequestStatus = 'pending' | 'viewed' | 'quoted' | 'declined';

export interface LookRequest {
  id: string;
  clientName: string;
  clientPhotoUri: string;
  generatedUri: string;
  lookId: string;
  lookName: string;
  lookCaption: string;
  artistId: string;
  message?: string;
  status: LookRequestStatus;
  createdAt: string;
  viewedAt?: string;
  quote?: string;
}

interface LookRequestState {
  requests: LookRequest[];
  isSyncing: boolean;
  sendRequest: (
    input: Omit<LookRequest, 'id' | 'status' | 'createdAt'> & { artistId: string },
  ) => Promise<string>;
  markViewed: (id: string) => Promise<void>;
  quote: (id: string, quote: string) => Promise<void>;
  decline: (id: string) => Promise<void>;
  fetchFromApi: () => Promise<void>;
  reset: () => void;
}

export const STATUS_LABEL: Record<LookRequestStatus, string> = {
  pending: 'Awaiting',
  viewed: 'Seen',
  quoted: 'Quoted',
  declined: 'Declined',
};

function apiToLocal(r: ApiLookRequest): LookRequest {
  return {
    id: r.id,
    clientName: '',
    clientPhotoUri: r.client_photo_url,
    generatedUri: r.generated_url,
    lookId: r.look_id,
    lookName: r.look_name,
    lookCaption: r.look_caption,
    artistId: r.artist_id,
    message: r.message ?? undefined,
    status: r.status,
    createdAt: r.created_at,
    viewedAt: r.viewed_at ?? undefined,
    quote: r.quote ?? undefined,
  };
}

function newLocalId(): string {
  return `lr_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

export const useLookRequests = create<LookRequestState>()(
  persist(
    (set, get) => ({
      requests: [],
      isSyncing: false,

      sendRequest: async (input) => {
        // Optimistic local entry immediately.
        const tempId = newLocalId();
        const optimistic: LookRequest = {
          ...input,
          id: tempId,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [optimistic, ...s.requests] }));

        try {
          const created = await apiCreateLookRequest({
            artist_id: input.artistId,
            look_id: input.lookId,
            look_name: input.lookName,
            look_caption: input.lookCaption,
            client_photo_url: input.clientPhotoUri,
            generated_url: input.generatedUri,
            message: input.message ?? null,
          });
          const real = apiToLocal(created);
          // Replace optimistic entry with the real one.
          set((s) => ({
            requests: s.requests.map((r) => (r.id === tempId ? { ...real, clientName: input.clientName } : r)),
          }));
          return real.id;
        } catch {
          // Keep optimistic version if API fails.
          return tempId;
        }
      },

      markViewed: async (id) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id && r.status === 'pending'
              ? { ...r, status: 'viewed', viewedAt: new Date().toISOString() }
              : r,
          ),
        }));
        try {
          const updated = await apiMarkLookRequestViewed(id);
          const local = apiToLocal(updated);
          set((s) => ({
            requests: s.requests.map((r) =>
              r.id === id ? { ...local, clientName: r.clientName } : r,
            ),
          }));
        } catch {
          // Optimistic already applied.
        }
      },

      quote: async (id, quoteText) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id ? { ...r, status: 'quoted', quote: quoteText } : r,
          ),
        }));
        try {
          await apiQuoteLookRequest(id, { quote: quoteText });
        } catch {
          // Optimistic already applied.
        }
      },

      decline: async (id) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === id ? { ...r, status: 'declined' } : r,
          ),
        }));
        try {
          await apiDeclineLookRequest(id);
        } catch {
          // Optimistic already applied.
        }
      },

      fetchFromApi: async () => {
        set({ isSyncing: true });
        try {
          const rows = await apiListMyLookRequests();
          // Merge with local: preserve clientName (not on API) from existing entries.
          const existing = new Map(get().requests.map((r) => [r.id, r]));
          const merged = rows.map((r) => {
            const local = existing.get(r.id);
            return { ...apiToLocal(r), clientName: local?.clientName ?? '' };
          });
          set({ requests: merged, isSyncing: false });
        } catch {
          set({ isSyncing: false });
        }
      },

      reset: () => set({ requests: [] }),
    }),
    {
      name: 'softglow.look-requests.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
