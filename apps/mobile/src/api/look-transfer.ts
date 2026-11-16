import { request } from './client';
import type { FeatureKey, Recipe } from './types';

export interface LookTransferValidation {
  passed: boolean;
  identity_preserved: boolean;
  makeup_applied: boolean;
  issues: string[];
}

export interface LookTransferResult {
  /** Relative `/media/...` path of the generated image. */
  generated_url: string;
  validation: LookTransferValidation;
}

/** Copies makeup from the inspiration photos onto the selfie. All URLs must come from uploadPhoto(). */
export async function apiTransferLook(input: {
  selfie_url: string;
  reference_urls: string[];
  features: Recipe;
}): Promise<LookTransferResult> {
  return request<LookTransferResult>('/look-transfer', { method: 'POST', body: input });
}

/** Applies one of the app's catalog looks to an uploaded selfie (server-side Gemini). */
export async function apiApplyCatalogLook(input: {
  selfie_url: string;
  look: {
    name: string;
    caption: string;
    finish: 'matte' | 'satin' | 'glow';
    shades: { lip: string; cheek: string; eye: string };
  };
  tone_tier?: number | null;
}): Promise<LookTransferResult> {
  return request<LookTransferResult>('/look-transfer/catalog', { method: 'POST', body: input });
}

/** Display order and labels for recipe features. */
export const FEATURES: { key: FeatureKey; label: string; icon: string }[] = [
  { key: 'brows', label: 'Brows', icon: 'analytics-outline' },
  { key: 'eyeshadow', label: 'Eyeshadow', icon: 'eye-outline' },
  { key: 'liner', label: 'Liner & lashes', icon: 'brush-outline' },
  { key: 'blush', label: 'Blush', icon: 'flower-outline' },
  { key: 'contour', label: 'Contour', icon: 'contrast-outline' },
  { key: 'lips', label: 'Lips', icon: 'water-outline' },
];

export const sourceLabel = (i: number) => `Look ${String.fromCharCode(65 + i)}`;
