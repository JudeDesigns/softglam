/**
 * Look Generation Service
 *
 * Flow:
 *  1. User picks a photo.
 *  2. A rich, photorealistic, skin-tone-aware prompt is built from the selected
 *     catalog look (shades + finish + caption + the user's Fitzpatrick tone tier)
 *     via `buildLookPrompt`.
 *  3. The photo + prompt are sent to the AI pipeline (Gemini 2.5 Flash Image,
 *     which edits the user's own photo in place) → candidate `generatedUri`.
 *  4. The candidate is checked by `validateGeneration` (a vision-capable Gemini
 *     call) to confirm (a) the person's identity/face was not altered, and
 *     (b) the makeup was actually applied as specified. On failure, generation
 *     is retried (with a reinforced prompt) up to `MAX_ATTEMPTS` times.
 *
 * While the production backend pipeline is under evaluation, this module provides:
 *  - The exact API contract (endpoint shape + types) that will be used once it lands.
 *  - A mock implementation that simulates the flow with a realistic delay so the UX
 *    can be built and tested end-to-end without a real AI backend.
 *  - A Gemini test-mode path that calls Gemini directly from the client for real testing.
 *
 * To switch from mock → real backend: replace the body of `generateLookOnPhoto`
 * with a real fetch call to the backend. Nothing else in the app needs to change
 * (validation would then run server-side too).
 */

import type { SkinToneTier } from '@softglow/types';
import type { MakeupLook } from '@/try-on/looks';

const AI_PIPELINE_ENABLED = false; // flip to true once the backend endpoint is live

/**
 * TEST MODE — uses Gemini 2.5 Flash Image ("Nano Banana") directly from the client.
 * Set EXPO_PUBLIC_GEMINI_API_KEY in your .env.local to test real AI generation.
 * Switch this off before production (use the backend pipeline instead).
 */
const GEMINI_TEST_MODE = true;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_VISION_MODEL = 'gemini-2.5-flash';

/** How many times to attempt generation before giving up on validation. */
const MAX_ATTEMPTS = 2;

export interface LookValidation {
  /** True only if identity was preserved AND makeup was applied correctly. */
  passed: boolean;
  identityPreserved: boolean;
  makeupApplied: boolean;
  /** Human-readable issues found, if any (empty when passed). */
  issues: string[];
}

export interface GenerationResult {
  /** The user's uploaded image, now hosted on cloud storage (or the original local URI, in mock/test mode). */
  uploadedPhotoUrl: string;
  /** AI-generated image: the look applied to the user's uploaded photo. */
  generatedUri: string;
  /** Result of the post-generation validator. Undefined in mock mode. */
  validation?: LookValidation;
}

export type GenerationStage =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'validating'
  | 'ready'
  | 'error';

// ---------------------------------------------------------------------------
// Prompt builder — one rich, skin-tone-aware, photorealistic prompt per look
// ---------------------------------------------------------------------------

const FINISH_DESCRIPTOR: Record<MakeupLook['finish'], string> = {
  matte: 'a soft matte finish with no shine',
  satin: 'a smooth satin finish with a subtle natural sheen',
  glow: 'a luminous, dewy glow finish with soft highlight',
};

/**
 * Fitzpatrick-tier-aware rendering guidance, so the same hex shade is adapted
 * to how pigment actually reads on that depth of skin (undertone, opacity,
 * and contrast) instead of being pasted on flatly.
 */
const TONE_DESCRIPTOR: Record<SkinToneTier, string> = {
  1: 'very fair skin with cool-to-neutral undertones — apply shades with light, buildable pigmentation and avoid harsh contrast so colours stay soft rather than overpowering.',
  2: 'light skin with warm-to-neutral undertones — apply shades with sheer-to-medium pigmentation, blended so the colour looks natural and not chalky.',
  3: 'medium skin with warm/golden undertones — apply shades at full intended pigmentation with a warm undertone adjustment so they read true-to-shade, not washed out.',
  4: 'olive-to-tan skin with warm undertones — apply shades with rich, true pigmentation and slightly boosted saturation so the colour is visible and doesn\u2019t appear muted against the skin\u2019s natural depth.',
  5: 'deep brown skin with warm-to-neutral undertones — apply shades with full, richly saturated pigmentation calibrated to show up vividly and accurately against deep skin, avoiding any grey or ashy cast.',
  6: 'very deep, rich skin with neutral-to-warm undertones — apply shades with maximum, true-to-pigment saturation and vibrancy so colour is clearly visible and complementary against deep skin, explicitly avoiding chalkiness, ashiness, or dulling of the tone.',
};

/**
 * Builds a detailed, photorealistic, skin-tone-aware makeup-application prompt
 * for a catalog look, intended for an image-editing model (e.g. Gemini) that
 * takes the user's own photo as input and must preserve their identity while
 * only changing makeup.
 *
 * @param toneTier Optional Fitzpatrick tone tier (1–6) from the user's skin
 *   profile. When provided, shade application is adapted to that skin depth
 *   so results look correct and flattering rather than a flat colour overlay.
 * @param reinforce When true, adds extra emphasis on identity preservation
 *   and colour accuracy — used on retry after a failed validation.
 */
export function buildLookPrompt(
  look: MakeupLook,
  toneTier?: SkinToneTier | null,
  reinforce = false,
): string {
  const parts = [
    `Apply the "${look.name}" professional makeup look to this person's face: ${look.caption}.`,
    `Lips: precisely recolour the lips to hex colour ${look.shades.lip}, applied evenly within the natural lip shape.`,
    `Cheeks: apply blush in hex colour ${look.shades.cheek}, softly blended along the cheekbones.`,
    `Eyes: apply eyeshadow/liner in hex colour ${look.shades.eye}, blended along the eyelid and crease.`,
    `Overall makeup finish: ${FINISH_DESCRIPTOR[look.finish]}.`,
  ];

  if (toneTier) {
    parts.push(`This person has ${TONE_DESCRIPTOR[toneTier]}`);
  }

  parts.push(
    "Keep this exact same person: identical face shape, identity, skin tone, hairstyle, pose, camera angle, lighting, and background — completely unchanged.",
    'Only modify the makeup on the lips, cheeks, and eyes. Do not alter facial structure, add accessories, or change clothing.',
    'The result must be photorealistic, high resolution, professional beauty photography quality, with natural-looking, expertly blended makeup application.',
  );

  if (reinforce) {
    parts.push(
      'IMPORTANT: The previous attempt either altered the person\u2019s identity/face or failed to visibly apply the requested makeup colours. Correct this: preserve every facial feature and identity detail exactly, and make sure the lip, cheek, and eye colours are clearly and accurately applied as specified above.',
    );
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Real API shape (ready for when the backend pipeline goes live)
// ---------------------------------------------------------------------------

interface GenerateLookRequest {
  photo_uri: string;
  look_id: string;
  prompt: string;
}

interface GenerateLookResponse {
  uploaded_photo_url: string;
  generated_url: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

/** Reads a local file URI (from expo-image-picker) into a base64 string. */
async function uriToBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read photo'));
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] ?? '');
    };
    reader.readAsDataURL(blob);
  });
}

/** Splits a `data:<mime>;base64,<data>` URI into its parts. Passes through remote http(s) URIs unchanged via fetch+base64. */
async function toInlineImagePart(uri: string): Promise<{ mimeType: string; data: string }> {
  if (uri.startsWith('data:')) {
    const [, header, data] = uri.match(/^data:([^;]+);base64,(.*)$/s) ?? [];
    return { mimeType: header ?? 'image/jpeg', data: data ?? '' };
  }
  return { mimeType: 'image/jpeg', data: await uriToBase64(uri) };
}

/** Calls Gemini 2.5 Flash Image to edit `photoUri` per `prompt`. Returns a data: URI. */
async function geminiGenerate(photoUri: string, prompt: string): Promise<string> {
  const image = await toInlineImagePart(photoUri);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }],
          },
        ],
      }),
    },
  );
  if (!res.ok) throw new Error('Gemini generation failed');
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) throw new Error('Gemini returned no image');
  return `data:${imagePart.inlineData.mimeType ?? 'image/jpeg'};base64,${imagePart.inlineData.data}`;
}

/**
 * Look Validator — uses a vision-capable Gemini call to compare the original
 * photo against the generated one and confirm:
 *  1. Identity preservation (same person, same face shape, no distortion).
 *  2. Correct makeup application (lip/cheek/eye colours match the look spec).
 */
export async function validateGeneration(
  originalUri: string,
  generatedUri: string,
  look: MakeupLook,
): Promise<LookValidation> {
  const [original, generated] = await Promise.all([
    toInlineImagePart(originalUri),
    toInlineImagePart(generatedUri),
  ]);

  const instructions = `You are a strict QA validator for an AI makeup try-on app. Compare IMAGE_1 (the original photo) and IMAGE_2 (the AI-edited result).

Check two things:
1. identity_preserved: Is IMAGE_2 clearly the SAME person as IMAGE_1 — same face shape, features, skin tone, hairstyle, pose and background — with no distortion, warping, or identity change? Minor lighting differences from makeup are fine.
2. makeup_applied: Does IMAGE_2 show visible, correctly applied makeup matching this look: lips approximately ${look.shades.lip}, cheeks/blush approximately ${look.shades.cheek}, eye makeup approximately ${look.shades.eye}, with a ${look.finish} finish? The colours don't need to be pixel-exact, but they must be clearly present and roughly in the right family/tone.

Respond with ONLY compact JSON, no markdown, in this exact shape:
{"identity_preserved": boolean, "makeup_applied": boolean, "issues": string[]}
"issues" should list short, specific problems found (empty array if none).`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: instructions },
              { text: 'IMAGE_1 (original):' },
              { inlineData: { mimeType: original.mimeType, data: original.data } },
              { text: 'IMAGE_2 (generated):' },
              { inlineData: { mimeType: generated.mimeType, data: generated.data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );

  if (!res.ok) {
    // Fail open on infra errors so a validator outage doesn't block the whole flow,
    // but flag it clearly rather than silently pretending it passed.
    return {
      passed: false,
      identityPreserved: false,
      makeupApplied: false,
      issues: ['Validator request failed'],
    };
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? '{}';

  let parsed: { identity_preserved?: boolean; makeup_applied?: boolean; issues?: string[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { identity_preserved: false, makeup_applied: false, issues: ['Validator returned malformed response'] };
  }

  const identityPreserved = parsed.identity_preserved === true;
  const makeupApplied = parsed.makeup_applied === true;
  return {
    passed: identityPreserved && makeupApplied,
    identityPreserved,
    makeupApplied,
    issues: parsed.issues ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Applies the given catalog look to the user's uploaded photo and returns the
 * generated preview URI. In Gemini test mode, the result is checked by the
 * validator and regenerated (up to `MAX_ATTEMPTS` times) if it fails.
 */
export async function generateLookOnPhoto(params: {
  photoUri: string;
  look: MakeupLook;
  toneTier?: SkinToneTier | null;
  onStage: (s: GenerationStage) => void;
}): Promise<GenerationResult> {
  const { photoUri, look, toneTier, onStage } = params;

  onStage('uploading');

  if (AI_PIPELINE_ENABLED) {
    const prompt = buildLookPrompt(look, toneTier);
    const body: GenerateLookRequest = { photo_uri: photoUri, look_id: look.id, prompt };
    onStage('generating');
    const res = await fetch('/api/v1/generation/apply-look', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Generation failed');
    const data = (await res.json()) as GenerateLookResponse;
    onStage('ready');
    return { uploadedPhotoUrl: data.uploaded_photo_url, generatedUri: data.generated_url };
  }

  if (GEMINI_TEST_MODE) {
    let lastGeneratedUri = '';
    let lastValidation: LookValidation | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      onStage('generating');
      const prompt = buildLookPrompt(look, toneTier, attempt > 1);
      lastGeneratedUri = await geminiGenerate(photoUri, prompt);

      onStage('validating');
      lastValidation = await validateGeneration(photoUri, lastGeneratedUri, look);
      if (lastValidation.passed) break;
    }

    onStage('ready');
    return { uploadedPhotoUrl: photoUri, generatedUri: lastGeneratedUri, validation: lastValidation };
  }

  // Mock: simulate upload + generation delay.
  await sleep(1000);
  onStage('generating');
  await sleep(2000);
  onStage('ready');
  return {
    uploadedPhotoUrl: photoUri,
    generatedUri: `https://placehold.co/240x320/${look.shades.lip.replace('#', '')}/fff?text=You+%2B+${encodeURIComponent(look.name)}`,
  };
}
