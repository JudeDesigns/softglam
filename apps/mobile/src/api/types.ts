/**
 * Wire-shape types for API responses. Hand-written for now; replace with
 * generated types from the FastAPI OpenAPI schema once that pipeline lands.
 */

import type { SkinConcern, SkinToneTier, SkinType, UserRole, FaceZoneTag } from '@softglow/types';

export type LookFinish = 'matte' | 'satin' | 'glow';

export interface ApiUser {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiTokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiAuthResponse {
  user: ApiUser;
  tokens: ApiTokenPair;
}

export interface ApiArtist {
  id: string;
  name: string;
  handle: string;
  city: string;
  specialty: string;
  rating: number;
  response_time_hours: number;
  finishes: LookFinish[];
  years_experience: number;
  bio: string | null;
}

export type ApiLookRequestStatus = 'pending' | 'viewed' | 'quoted' | 'declined';

export interface ApiLookRequest {
  id: string;
  client_id: string;
  artist_id: string;
  look_id: string;
  look_name: string;
  look_caption: string;
  client_photo_url: string;
  generated_url: string;
  message: string | null;
  status: ApiLookRequestStatus;
  quote: string | null;
  created_at: string;
  viewed_at: string | null;
  responded_at: string | null;
}

export interface ApiSkinProfile {
  id: string;
  user_id: string;
  tone_tier: SkinToneTier;
  skin_type: SkinType;
  concerns: Partial<Record<SkinConcern, number>>;
  zone_tags: FaceZoneTag[];
  health_score: number;
  captured_at: string;
  updated_at: string;
}

export type ApiInviteChannel = 'email' | 'sms' | 'link';
export type ApiInviteStatus = 'sent' | 'accepted' | 'expired';

export interface ApiInvite {
  id: string;
  artist_id: string;
  accepted_by_client_id: string | null;
  client_name: string;
  contact: string;
  channel: ApiInviteChannel;
  message: string | null;
  code: string;
  status: ApiInviteStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface ApiProduct {
  id: string;
  brand: string;
  name: string;
  price: number;
  health_score: number;
  is_toxin_free: boolean;
  targets: string[];
  ingredients: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ApiAppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ApiAppointmentProduct {
  id: string;
  appointment_id: string;
  product_id: string | null;
  product_name: string;
  brand: string;
  quantity: number;
  unit_cost: number;
  cogs: number;
  created_at: string;
}

export interface ApiAppointment {
  id: string;
  artist_id: string;
  client_id: string;
  look_request_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  service_name: string;
  notes: string | null;
  quoted_price: number | null;
  final_price: number | null;
  status: ApiAppointmentStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  products: ApiAppointmentProduct[];
}
