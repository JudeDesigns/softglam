import { request } from './client';
import type { ApiSkinProfile } from './types';
import type { SkinConcern, SkinToneTier, SkinType, FaceZoneTag } from '@softglow/types';

export interface SkinProfileUpsertInput {
  tone_tier: SkinToneTier;
  skin_type: SkinType;
  concerns: Partial<Record<SkinConcern, number>>;
  zone_tags: FaceZoneTag[];
}

export async function apiGetMySkinProfile(): Promise<ApiSkinProfile> {
  return request<ApiSkinProfile>('/skin-profiles/me');
}

export async function apiUpsertMySkinProfile(
  input: SkinProfileUpsertInput,
): Promise<ApiSkinProfile> {
  return request<ApiSkinProfile>('/skin-profiles/me', {
    method: 'PUT',
    body: input,
  });
}
