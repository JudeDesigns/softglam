/**
 * Catalog-look generation: applies one of the app's looks to the user's photo.
 *
 * Flow:
 *  1. Upload the photo (POST /media).
 *  2. The server builds the skin-tone-aware prompt, runs Gemini, checks the
 *     result (same person, makeup applied) and retries once if it fails.
 *     The Gemini API key lives only on the server — never in this app.
 */

import type { SkinToneTier } from '@softglow/types';
import { apiApplyCatalogLook } from '@/api/look-transfer';
import { uploadPhoto } from '@/api/media';
import type { MakeupLook } from '@/try-on/looks';

export interface LookValidation {
  /** True only if identity was preserved AND makeup was applied correctly. */
  passed: boolean;
  identityPreserved: boolean;
  makeupApplied: boolean;
  /** Human-readable issues found, if any (empty when passed). */
  issues: string[];
}

export interface GenerationResult {
  /** The user's uploaded photo, as a stored /media path. */
  uploadedPhotoUrl: string;
  /** AI-generated image (stored /media path): the look applied to the photo. */
  generatedUri: string;
  /** Result of the server's post-generation check. */
  validation: LookValidation;
}

export type GenerationStage =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'validating'
  | 'ready'
  | 'error';

/** Applies `look` to the photo at `photoUri` and returns the stored result. */
export async function generateLookOnPhoto(params: {
  photoUri: string;
  photoMimeType?: string;
  look: MakeupLook;
  toneTier?: SkinToneTier | null;
  onStage: (s: GenerationStage) => void;
}): Promise<GenerationResult> {
  const { photoUri, photoMimeType, look, toneTier, onStage } = params;

  onStage('uploading');
  const uploadedPhotoUrl = await uploadPhoto(photoUri, photoMimeType);

  // Generation and the identity/makeup check both run in this one request.
  onStage('generating');
  const res = await apiApplyCatalogLook({
    selfie_url: uploadedPhotoUrl,
    look: { name: look.name, caption: look.caption, finish: look.finish, shades: look.shades },
    tone_tier: toneTier ?? null,
  });
  onStage('ready');

  return {
    uploadedPhotoUrl,
    generatedUri: res.generated_url,
    validation: {
      passed: res.validation.passed,
      identityPreserved: res.validation.identity_preserved,
      makeupApplied: res.validation.makeup_applied,
      issues: res.validation.issues,
    },
  };
}
