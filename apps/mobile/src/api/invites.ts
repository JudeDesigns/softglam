import { request } from './client';
import type { ApiInvite } from './types';

export interface InviteCreateInput {
  client_name: string;
  contact: string;
  channel: 'email' | 'sms' | 'link';
  message?: string | null;
}

export interface InviteAcceptInput {
  code: string;
}

export async function apiListMyInvites(): Promise<ApiInvite[]> {
  return request<ApiInvite[]>('/invites');
}

export async function apiCreateInvite(input: InviteCreateInput): Promise<ApiInvite> {
  return request<ApiInvite>('/invites', {
    method: 'POST',
    body: input,
  });
}

export async function apiAcceptInvite(input: InviteAcceptInput): Promise<ApiInvite> {
  return request<ApiInvite>('/invites/accept', {
    method: 'POST',
    body: input,
  });
}
