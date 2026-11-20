import { request } from './client';
import type { ApiLookRequest, Recipe } from './types';

export interface LookRequestCreateInput {
  artist_id: string;
  look_id: string;
  look_name: string;
  look_caption: string;
  client_photo_url: string;
  generated_url: string;
  reference_urls?: string[] | null;
  recipe?: Recipe | null;
  message?: string | null;
}

export interface LookRequestQuoteInput {
  quote: string;
  quoted_price?: number | null;
  /** ISO datetime in the future. */
  proposed_at?: string | null;
}

export async function apiListMyLookRequests(): Promise<ApiLookRequest[]> {
  return request<ApiLookRequest[]>('/look-requests');
}

export async function apiCreateLookRequest(
  input: LookRequestCreateInput,
): Promise<ApiLookRequest> {
  return request<ApiLookRequest>('/look-requests', {
    method: 'POST',
    body: input,
  });
}

export async function apiGetLookRequest(id: string): Promise<ApiLookRequest> {
  return request<ApiLookRequest>(`/look-requests/${id}`);
}

export async function apiMarkLookRequestViewed(id: string): Promise<ApiLookRequest> {
  return request<ApiLookRequest>(`/look-requests/${id}/mark-viewed`, { method: 'POST' });
}

export async function apiQuoteLookRequest(
  id: string,
  input: LookRequestQuoteInput,
): Promise<ApiLookRequest> {
  return request<ApiLookRequest>(`/look-requests/${id}/quote`, {
    method: 'POST',
    body: input,
  });
}

export async function apiDeclineLookRequest(id: string): Promise<ApiLookRequest> {
  return request<ApiLookRequest>(`/look-requests/${id}/decline`, { method: 'POST' });
}

/** Client accepts the artist's quote; the server books the appointment. */
export async function apiAcceptLookRequest(id: string): Promise<ApiLookRequest> {
  return request<ApiLookRequest>(`/look-requests/${id}/accept`, { method: 'POST' });
}
