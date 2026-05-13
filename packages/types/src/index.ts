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

export type SkinConcern =
  | 'acne'
  | 'dryness'
  | 'oiliness'
  | 'redness'
  | 'sensitivity'
  | 'darkCircles'
  | 'pores'
  | 'hydration';

export type SeverityLevel = 0 | 1 | 2 | 3 | 4;

export interface SkinProfile {
  toneTier: 1 | 2 | 3 | 4 | 5 | 6;
  type: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
  sensitivity: 'low' | 'medium' | 'high';
  concerns: Partial<Record<SkinConcern, SeverityLevel>>;
  // Zone-tagged concerns from the Smart Reticle (x/y are 0..1 normalized).
  zoneTags?: Array<{
    x: number;
    y: number;
    concerns: SkinConcern[];
  }>;
  /** 0..100 aggregate "Skin Health Score". */
  healthScore: number;
  capturedAt: string;
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
