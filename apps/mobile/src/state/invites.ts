import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiCreateInvite, apiListMyInvites } from '@/api/invites';
import type { ApiInvite } from '@/api/types';

/**
 * Artist→client invitations. Backed by the real API; local state is optimistic cache.
 */

export type InviteChannel = 'email' | 'sms' | 'link';
export type InviteStatus = 'sent' | 'accepted' | 'expired';

export interface Invite {
  id: string;
  clientName: string;
  contact: string;
  channel: InviteChannel;
  message?: string;
  status: InviteStatus;
  createdAt: string;
  code: string;
}

interface InviteState {
  invites: Invite[];
  isSyncing: boolean;
  send: (input: Omit<Invite, 'id' | 'status' | 'createdAt' | 'code'>) => Promise<string>;
  fetchFromApi: () => Promise<void>;
  reset: () => void;
}

export const CHANNEL_LABEL: Record<InviteChannel, string> = {
  email: 'Email',
  sms: 'Text message',
  link: 'Share link',
};

function apiToLocal(i: ApiInvite): Invite {
  return {
    id: i.id,
    clientName: i.client_name,
    contact: i.contact,
    channel: i.channel as InviteChannel,
    message: i.message ?? undefined,
    status: i.status as InviteStatus,
    createdAt: i.created_at,
    code: i.code,
  };
}

function newLocalId(): string {
  return `inv_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

export const useInvites = create<InviteState>()(
  persist(
    (set, get) => ({
      invites: [],
      isSyncing: false,

      send: async (input) => {
        const tempId = newLocalId();
        const optimistic: Invite = {
          ...input,
          id: tempId,
          status: 'sent',
          createdAt: new Date().toISOString(),
          code: '',
        };
        set((s) => ({ invites: [optimistic, ...s.invites] }));

        try {
          const created = await apiCreateInvite({
            client_name: input.clientName,
            contact: input.contact,
            channel: input.channel,
            message: input.message ?? null,
          });
          const real = apiToLocal(created);
          set((s) => ({
            invites: s.invites.map((i) => (i.id === tempId ? real : i)),
          }));
          return real.id;
        } catch {
          return tempId;
        }
      },

      fetchFromApi: async () => {
        set({ isSyncing: true });
        try {
          const rows = await apiListMyInvites();
          set({ invites: rows.map(apiToLocal), isSyncing: false });
        } catch {
          set({ isSyncing: false });
        }
      },

      reset: () => set({ invites: [] }),
    }),
    {
      name: 'softglow.invites.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
