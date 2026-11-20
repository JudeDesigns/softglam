import type { ApiAppointmentStatus } from '@/api/types';

/** Label + badge colours for each appointment status. */
export const BOOKING_STATUS: Record<ApiAppointmentStatus, { label: string; bg: string; text: string }> = {
  booked: { label: 'Needs confirming', bg: '#E8C79AAA', text: '#7A5A2A' },
  confirmed: { label: 'Confirmed', bg: '#8A9A7E33', text: '#4A6240' },
  completed: { label: 'Completed', bg: '#F3EBE0', text: '#7A6050' },
  cancelled: { label: 'Cancelled', bg: '#A8423A22', text: '#A8423A' },
  no_show: { label: 'No-show', bg: '#A8423A22', text: '#A8423A' },
};
