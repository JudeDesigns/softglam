import { create } from 'zustand';
import {
  apiCancelAppointment,
  apiCompleteAppointment,
  apiConfirmAppointment,
  apiCreateAppointment,
  apiListAppointments,
  apiUpdateAppointment,
  type AppointmentCreateInput,
  type AppointmentUpdateInput,
} from '@/api/appointments';
import type { ApiAppointment } from '@/api/types';

interface AppointmentsState {
  appointments: ApiAppointment[];
  isLoading: boolean;
  error: string | null;

  fetchFromApi: (upcomingOnly?: boolean) => Promise<void>;
  create: (input: AppointmentCreateInput) => Promise<ApiAppointment>;
  update: (id: string, input: AppointmentUpdateInput) => Promise<void>;
  confirm: (id: string) => Promise<void>;
  complete: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;

  reset: () => void;
}

function upsert(list: ApiAppointment[], updated: ApiAppointment): ApiAppointment[] {
  const idx = list.findIndex((a) => a.id === updated.id);
  if (idx === -1) return [updated, ...list];
  const next = [...list];
  next[idx] = updated;
  return next;
}

export const useAppointments = create<AppointmentsState>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  fetchFromApi: async (upcomingOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiListAppointments(upcomingOnly);
      set({ appointments: data, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load appointments', isLoading: false });
    }
  },

  create: async (input) => {
    const appt = await apiCreateAppointment(input);
    set((s) => ({ appointments: [appt, ...s.appointments] }));
    return appt;
  },

  update: async (id, input) => {
    const updated = await apiUpdateAppointment(id, input);
    set((s) => ({ appointments: upsert(s.appointments, updated) }));
  },

  confirm: async (id) => {
    const updated = await apiConfirmAppointment(id);
    set((s) => ({ appointments: upsert(s.appointments, updated) }));
  },

  complete: async (id) => {
    const updated = await apiCompleteAppointment(id);
    set((s) => ({ appointments: upsert(s.appointments, updated) }));
  },

  cancel: async (id) => {
    const updated = await apiCancelAppointment(id);
    set((s) => ({ appointments: upsert(s.appointments, updated) }));
  },

  reset: () => set({ appointments: [] }),
}));
