import { request } from './client';
import type { ApiAppointment, ApiAppointmentProduct } from './types';

export interface AppointmentCreateInput {
  client_id: string;
  look_request_id?: string | null;
  scheduled_at: string;
  duration_minutes?: number;
  location?: string | null;
  service_name: string;
  notes?: string | null;
  quoted_price?: number | null;
}

export interface AppointmentUpdateInput {
  scheduled_at?: string;
  duration_minutes?: number;
  location?: string | null;
  service_name?: string;
  notes?: string | null;
  quoted_price?: number | null;
  final_price?: number | null;
}

export interface AppointmentProductInput {
  product_id?: string | null;
  product_name: string;
  brand: string;
  quantity?: number;
  unit_cost: number;
}

export async function apiListAppointments(upcomingOnly?: boolean): Promise<ApiAppointment[]> {
  const q = upcomingOnly ? '?upcoming_only=true' : '';
  return request<ApiAppointment[]>(`/appointments${q}`);
}

export async function apiGetAppointment(id: string): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/${id}`);
}

export async function apiCreateAppointment(
  input: AppointmentCreateInput,
): Promise<ApiAppointment> {
  return request<ApiAppointment>('/appointments', { method: 'POST', body: input });
}

export async function apiUpdateAppointment(
  id: string,
  input: AppointmentUpdateInput,
): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/${id}`, { method: 'PATCH', body: input });
}

export async function apiConfirmAppointment(id: string): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/${id}/confirm`, { method: 'POST' });
}

export async function apiCompleteAppointment(id: string): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/${id}/complete`, { method: 'POST' });
}

export async function apiCancelAppointment(id: string): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/${id}/cancel`, { method: 'POST' });
}

export async function apiAddAppointmentProduct(
  appointmentId: string,
  input: AppointmentProductInput,
): Promise<ApiAppointmentProduct> {
  return request<ApiAppointmentProduct>(`/appointments/${appointmentId}/products`, {
    method: 'POST',
    body: input,
  });
}

export async function apiRemoveAppointmentProduct(
  appointmentId: string,
  productId: string,
): Promise<void> {
  return request<void>(`/appointments/${appointmentId}/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function apiGetCogsSummary(
  appointmentId: string,
): Promise<{ appointment_id: string; total_cogs: number; final_price: number | null; gross_margin_pct: number | null; products: ApiAppointmentProduct[] }> {
  return request(`/appointments/${appointmentId}/cogs-summary`);
}
