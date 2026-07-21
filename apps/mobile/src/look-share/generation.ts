/**
 * Look Generation Service
 *
 * Flow:
 *  1. User picks a photo → upload to S3 via presigned URL (or the generation API directly)
 *  2. The API triggers an AI pipeline (n8n → Stable Diffusion + ControlNet) that produces
 *     a carousel of "look previews" — the same makeup style applied to a neutral reference
 *     face, each with a prompt label.
 *  3. User browses the carousel and selects one preview.
 *  4. The selected prompt is sent back along with the user's photo, and the AI applies
 *     that specific look to the user's own face → final `generatedUri`.
 *
 * While the AI pipeline is under evaluation, this module provides:
 *  - The exact API contract (endpoint shapes + types) that will be used once the pipeline lands.
 *  - A mock implementation that simulates the flow with realistic delays so the UX can be built
 *    and tested end-to-end without a real AI backend.
 *
 * To switch from mock → real: replace the body of `uploadAndGenerateLookOptions` and
 * `applySelectedLook` with real fetch calls. Nothing else in the app needs to change.
 */

const AI_PIPELINE_ENABLED = false; // flip to true once the n8n endpoint is live

/**
 * TEST MODE — uses Replicate's PhotoMaker model directly from the client.
 * Set to true + add your REPLICATE_API_TOKEN below to test real AI generation.
 * Switch this off before production (use the n8n backend pipeline instead).
 */
const REPLICATE_TEST_MODE = false;
const REPLICATE_API_TOKEN = 'YOUR_REPLICATE_TOKEN_HERE'; // get one free at replicate.com

// Replicate model: tencentarc/photomaker (face + style prompt → styled face image)
const REPLICATE_MODEL_VERSION = 'ddfc2b08d209f9fa8c1eca692712918bd449f695d785824b1f08cc3a7eacb20d';

export interface LookOption {
  id: string;
  /** Human-readable label, e.g. "Warm Terracotta" */
  label: string;
  /** Stable Diffusion prompt used to generate this style */
  prompt: string;
  /** URI of the preview image (a reference face with this look applied) */
  previewUri: string;
  /** Colour hex used for the swatch in the selector */
  swatchColor: string;
}

export interface GenerationResult {
  /** The user's uploaded image, now hosted on cloud storage */
  uploadedPhotoUrl: string;
  /** AI-generated image: the selected look applied to the user's uploaded photo */
  generatedUri: string;
  /** The look option the user selected */
  selectedOption: LookOption;
}

export type GenerationStage =
  | 'idle'
  | 'uploading'
  | 'generating-options'
  | 'awaiting-selection'
  | 'applying'
  | 'ready'
  | 'error';

// ---------------------------------------------------------------------------
// Real API shapes (ready for when the pipeline goes live)
// ---------------------------------------------------------------------------

interface GenerateLookOptionsRequest {
  photo_uri: string;
  look_id: string;
  look_catalog_prompt: string;
}

interface GenerateLookOptionsResponse {
  session_id: string;
  uploaded_photo_url: string;
  options: LookOption[];
}

interface ApplyLookRequest {
  session_id: string;
  option_id: string;
}

interface ApplyLookResponse {
  generated_url: string;
}

// ---------------------------------------------------------------------------
// Mock look options (same as the look palette in the catalog for now)
// ---------------------------------------------------------------------------

const MOCK_OPTIONS: LookOption[] = [
  {
    id: 'opt-1',
    label: 'Warm Terracotta',
    prompt: 'warm terracotta lip, peachy blush, subtle bronze eye',
    previewUri: 'https://placehold.co/240x320/C2694A/fff?text=Terracotta',
    swatchColor: '#C2694A',
  },
  {
    id: 'opt-2',
    label: 'Dusty Rose',
    prompt: 'dusty rose lip, soft pink blush, nude shimmer eye',
    previewUri: 'https://placehold.co/240x320/C9899A/fff?text=Dusty+Rose',
    swatchColor: '#C9899A',
  },
  {
    id: 'opt-3',
    label: 'Berry Drama',
    prompt: 'deep berry lip, contoured cheek, smoked plum eye',
    previewUri: 'https://placehold.co/240x320/6B2D5E/fff?text=Berry',
    swatchColor: '#6B2D5E',
  },
  {
    id: 'opt-4',
    label: 'Golden Hour',
    prompt: 'nude lip, sun-kissed blush, champagne highlight',
    previewUri: 'https://placehold.co/240x320/D4AF37/fff?text=Golden',
    swatchColor: '#D4AF37',
  },
  {
    id: 'opt-5',
    label: 'Barely There',
    prompt: 'MLBB lip, light peach blush, clean lash look',
    previewUri: 'https://placehold.co/240x320/E8C5A0/000?text=Natural',
    swatchColor: '#E8C5A0',
  },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Replicate helper — polls until prediction is complete
// ---------------------------------------------------------------------------
async function replicateGenerate(photoUri: string, stylePrompt: string): Promise<string> {
  // Step 1: create prediction
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: {
        prompt: `A photo of a person with ${stylePrompt}, professional makeup, high quality, detailed face`,
        input_image: photoUri,
        style_strength_ratio: 20,
        num_outputs: 1,
        guidance_scale: 5,
        num_inference_steps: 50,
      },
    }),
  });
  if (!createRes.ok) throw new Error('Replicate create failed');
  const prediction = (await createRes.json()) as { id: string; urls: { get: string } };

  // Step 2: poll until done (max 90s)
  const pollUrl = prediction.urls.get;
  for (let i = 0; i < 30; i++) {
    await sleep(3000);
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });
    const result = (await pollRes.json()) as { status: string; output?: string[] };
    if (result.status === 'succeeded' && result.output?.[0]) {
      return result.output[0];
    }
    if (result.status === 'failed') throw new Error('Replicate generation failed');
  }
  throw new Error('Replicate timed out');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Phase 1: Upload the user's photo and retrieve a set of AI-generated look previews.
 * Returns the session id and the look options the user can choose from.
 */
export async function uploadAndGenerateLookOptions(params: {
  photoUri: string;
  lookId: string;
  lookPrompt: string;
  onStage: (s: GenerationStage) => void;
}): Promise<{ sessionId: string; uploadedPhotoUrl: string; options: LookOption[] }> {
  const { photoUri, lookId, lookPrompt, onStage } = params;

  onStage('uploading');

  if (AI_PIPELINE_ENABLED) {
    const body: GenerateLookOptionsRequest = {
      photo_uri: photoUri,
      look_id: lookId,
      look_catalog_prompt: lookPrompt,
    };
    const res = await fetch('/api/v1/generation/look-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Generation failed');
    const data = (await res.json()) as GenerateLookOptionsResponse;
    onStage('awaiting-selection');
    return {
      sessionId: data.session_id,
      uploadedPhotoUrl: data.uploaded_photo_url,
      options: data.options,
    };
  }

  // Mock: simulate upload delay then option generation.
  await sleep(1200);
  onStage('generating-options');
  await sleep(1800);
  onStage('awaiting-selection');
  return {
    sessionId: `mock-session-${Date.now()}`,
    uploadedPhotoUrl: photoUri,
    options: MOCK_OPTIONS,
  };
}

/**
 * Phase 2: Apply the selected look option to the user's uploaded photo.
 * Returns the final URI of the user's photo with the makeup applied.
 */
export async function applySelectedLook(params: {
  sessionId: string;
  optionId: string;
  fallbackPhotoUri: string;
  onStage: (s: GenerationStage) => void;
}): Promise<GenerationResult & { options: LookOption[] }> {
  const { sessionId, optionId, fallbackPhotoUri, onStage } = params;
  const selected = MOCK_OPTIONS.find((o) => o.id === optionId) ?? MOCK_OPTIONS[0]!;

  onStage('applying');

  if (AI_PIPELINE_ENABLED) {
    const body: ApplyLookRequest = { session_id: sessionId, option_id: optionId };
    const res = await fetch('/api/v1/generation/apply-look', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Apply look failed');
    const data = (await res.json()) as ApplyLookResponse;
    onStage('ready');
    return {
      uploadedPhotoUrl: fallbackPhotoUri,
      generatedUri: data.generated_url,
      selectedOption: selected,
      options: MOCK_OPTIONS,
    };
  }

  if (REPLICATE_TEST_MODE) {
    // Call Replicate directly — real AI generation, real result
    const generatedUri = await replicateGenerate(fallbackPhotoUri, selected.prompt);
    onStage('ready');
    return {
      uploadedPhotoUrl: fallbackPhotoUri,
      generatedUri,
      selectedOption: selected,
      options: MOCK_OPTIONS,
    };
  }

  // Mock: simulate apply delay.
  await sleep(2200);
  onStage('ready');
  return {
    uploadedPhotoUrl: fallbackPhotoUri,
    generatedUri: `https://placehold.co/240x320/${selected.swatchColor.replace('#', '')}/fff?text=You+%2B+${encodeURIComponent(selected.label)}`,
    selectedOption: selected,
    options: MOCK_OPTIONS,
  };
}
