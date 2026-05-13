/**
 * Cross-app domain types. These will eventually be generated from the
 * FastAPI OpenAPI schema; for now they are hand-written stubs that
 * the mobile app uses for mock data.
 */

export type UserRole = 'client' | 'artist' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

/**
 * Concerns and weights are anchored in the Skin Quality Assessment Scale
 * (SQS; Goldie et al., J Cosmet Dermatol 2024) which expert-ranked hydration
 * as the highest-impact contributor to skin quality, followed by texture
 * (pores) and discoloration (redness, dark circles). Firmness/laxity is
 * intentionally excluded — SoftGlow's target user is not aging-focused.
 */
export type SkinConcern =
  | 'acne'
  | 'dryness'
  | 'oiliness'
  | 'redness'
  | 'sensitivity'
  | 'darkCircles'
  | 'pores';

export type SeverityLevel = 0 | 1 | 2 | 3 | 4;

export const SKIN_CONCERNS: readonly SkinConcern[] = [
  'acne',
  'dryness',
  'oiliness',
  'redness',
  'sensitivity',
  'darkCircles',
  'pores',
] as const;

/** Weights derived from SQS expert ranking. See research note in repo. */
export const CONCERN_WEIGHTS: Readonly<Record<SkinConcern, number>> = {
  dryness: 1.4,
  acne: 1.2,
  redness: 1.1,
  pores: 1.0,
  oiliness: 0.9,
  darkCircles: 0.8,
  sensitivity: 0.5,
};

export const CONCERN_LABELS: Readonly<Record<SkinConcern, string>> = {
  acne: 'Acne',
  dryness: 'Dryness',
  oiliness: 'Oiliness',
  redness: 'Redness',
  sensitivity: 'Sensitivity',
  darkCircles: 'Dark Circles',
  pores: 'Pores',
};

export type SkinToneTier = 1 | 2 | 3 | 4 | 5 | 6;
export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';

export interface FaceZoneTag {
  /** Normalized 0..1 coordinates on the portrait. */
  x: number;
  y: number;
  /** Stable id so we can update/remove a tag. */
  id: string;
  concerns: SkinConcern[];
}

export interface SkinProfile {
  toneTier: SkinToneTier;
  type: SkinType;
  concerns: Partial<Record<SkinConcern, SeverityLevel>>;
  zoneTags: FaceZoneTag[];
  /** 0..100 aggregate skin health score. */
  healthScore: number;
  capturedAt: string;
}

/**
 * Compute the Skin Health Score (0..100).
 *
 *   score = 100 − ( Σ wᵢ × (severityᵢ / maxSeverity) × 100 ) / Σ wᵢ
 *
 * Missing concerns are treated as severity 0 (no deficit).
 */
export function computeHealthScore(
  concerns: Partial<Record<SkinConcern, SeverityLevel>>,
): number {
  const maxSeverity = 4;
  let weightedDeficit = 0;
  let totalWeight = 0;

  for (const concern of SKIN_CONCERNS) {
    const weight = CONCERN_WEIGHTS[concern];
    const severity = concerns[concern] ?? 0;
    weightedDeficit += weight * (severity / maxSeverity) * 100;
    totalWeight += weight;
  }

  const rawScore = 100 - weightedDeficit / totalWeight;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/** Top-N concerns by (severity × weight), for surfacing on the Home metric pills. */
export function topConcerns(
  concerns: Partial<Record<SkinConcern, SeverityLevel>>,
  n: number,
): Array<{ concern: SkinConcern; severity: SeverityLevel; score: number }> {
  return SKIN_CONCERNS.map((concern) => {
    const severity = (concerns[concern] ?? 0) as SeverityLevel;
    return {
      concern,
      severity,
      score: severity * CONCERN_WEIGHTS[concern],
    };
  })
    .filter((c) => c.severity > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  healthScore: number;
  price: number;
  currency: 'CAD' | 'USD';
  imageUrl: string;
  isToxinFree: boolean;
}

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  artistId: string;
  clientId: string;
  scheduledTime: string;
  status: AppointmentStatus;
  blueprintImageUrl?: string;
  calculatedCogs?: number;
}
