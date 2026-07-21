import { request } from './client';
import type { ApiArtist } from './types';

export async function apiListArtists(): Promise<ApiArtist[]> {
  return request<ApiArtist[]>('/artists');
}

export async function apiGetArtist(id: string): Promise<ApiArtist> {
  return request<ApiArtist>(`/artists/${id}`);
}

export async function apiGetMyArtistProfile(): Promise<ApiArtist> {
  return request<ApiArtist>('/artists/me');
}
