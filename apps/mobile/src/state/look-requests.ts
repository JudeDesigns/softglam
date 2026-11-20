import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  apiAcceptLookRequest,
  apiCreateLookRequest,
  apiDeclineLookRequest,
  apiListMyLookRequests,
  apiMarkLookRequestViewed,
  apiQuoteLookRequest,
} from '@/api/look-requests';
import { uploadPhoto } from '@/api/media';
import type { ApiLookRequest, Recipe } from '@/api/types';

/**
 * Look-share request lifecycle. Backed by the real API; local state is a
 * cache. sendRequest uploads any local photos, creates the record server-side
 * and caches it (throwing if that fails, so the client never thinks a request
 * reached the artist when it didn't). fetchFromApi re-hydrates from the server.
 */

export type LookRequestStatus = 'pending' | 'viewed' | 'quoted' | 'declined' | 'accepted';

export interface LookRequest {
  id: string;
  clientName: string;
  clientPhotoUri: string;
  generatedUri: string;
  /** "Copy a look" requests: inspiration photos (A, B, C) and per-feature recipe. */
  referenceUrls?: string[];
  recipe?: Recipe;
  lookId: string;
  lookName: string;
  lookCaption: string;
  artistId: string;
  message?: string;
  status: LookRequestStatus;
  createdAt: string;
  viewedAt?: string;
  quote?: string;
  quotedPrice?: number;
  /** ISO time the artist proposed for the appointment. */
  proposedAt?: string;
  /** Booked appointment, once the client accepted the quote. */
  appointmentId?: string;
  artistName?: string;
}

export interface QuoteInput {
  quote: string;
  quotedPrice?: number;
  proposedAt?: string;
}

interface LookRequestState {
  requests: LookRequest[];
  isSyncing: boolean;
  sendRequest: (
    input: Omit<LookRequest, 'id' | 'status' | 'createdAt'> & { artistId: string },
  ) => Promise<string>;
  markViewed: (id: string) => Promise<void>;
  /** These throw if the server rejects or can't be reached — show the error. */
  quote: (id: string, input: QuoteInput) => Promise<void>;
  decline: (id: string) => Promise<void>;
  accept: (id: string) => Promise<LookRequest>;
  fetchFromApi: () => Promise<void>;
  /** Insert or replace one request with the server's copy. */
  upsert: (r: LookRequest) => void;
  reset: () => void;
}

export const STATUS_LABEL: Record<LookRequestStatus, string> = {
  pending: 'Awaiting',
  viewed: 'Seen',
  quoted: 'Quoted',
  declined: 'Declined',
  accepted: 'Booked',
};

function apiToLocal(r: ApiLookRequest): LookRequest {
  return {
    id: r.id,
    clientName: r.client_name ?? '',
    artistName: r.artist_name || undefined,
    quotedPrice: r.quoted_price ?? undefined,
    proposedAt: r.proposed_at ?? undefined,
    appointmentId: r.appointment_id ?? undefined,
    clientPhotoUri: r.client_photo_url,
    generatedUri: r.generated_url,
    referenceUrls: r.reference_urls ?? undefined,
    recipe: r.recipe ?? undefined,
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

export const useLookRequests = create<LookRequestState>()(
  persist(
    (set, get) => ({
      requests: [],
      isSyncing: false,

      sendRequest: async (input) => {
        // Local file:// and data: images only exist on this phone — upload them
        // so the artist can see them. Already-uploaded /media paths pass through.
        const [clientPhotoUrl, generatedUrl] = await Promise.all([
          uploadPhoto(input.clientPhotoUri),
          uploadPhoto(input.generatedUri),
        ]);
        const created = await apiCreateLookRequest({
          artist_id: input.artistId,
          look_id: input.lookId,
          look_name: input.lookName,
          look_caption: input.lookCaption,
          client_photo_url: clientPhotoUrl,
          generated_url: generatedUrl,
          reference_urls: input.referenceUrls ?? null,
          recipe: input.recipe ?? null,
          message: input.message ?? null,
        });
        const real = apiToLocal(created);
        get().upsert(real);
        return real.id;
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

      quote: async (id, input) => {
        const updated = await apiQuoteLookRequest(id, {
          quote: input.quote,
          quoted_price: input.quotedPrice ?? null,
          proposed_at: input.proposedAt ?? null,
        });
        get().upsert(apiToLocal(updated));
      },

      decline: async (id) => {
        get().upsert(apiToLocal(await apiDeclineLookRequest(id)));
      },

      accept: async (id) => {
        const local = apiToLocal(await apiAcceptLookRequest(id));
        get().upsert(local);
        return local;
      },

      upsert: (incoming) =>
        set((s) => {
          const existing = s.requests.find((r) => r.id === incoming.id);
          const merged = { ...incoming, clientName: incoming.clientName || existing?.clientName || '' };
          return existing
            ? { requests: s.requests.map((r) => (r.id === incoming.id ? merged : r)) }
            : { requests: [merged, ...s.requests] };
        }),

      fetchFromApi: async () => {
        set({ isSyncing: true });
        try {
          const rows = await apiListMyLookRequests();
          set({ requests: rows.map(apiToLocal), isSyncing: false });
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
