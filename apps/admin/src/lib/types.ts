// Shared type shapes mirroring the FastAPI response models.

export type UserRole = 'client' | 'artist' | 'admin';
export type AppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type LookRequestStatus = 'pending' | 'viewed' | 'quoted' | 'declined';
export type InviteStatus = 'sent' | 'accepted' | 'expired';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  handle: string | null;
  city: string;
  specialty: string;
  bio: string | null;
  years_experience: number;
  rating: number;
  response_time_hours: number;
  created_at: string;
}

export interface SkinProfile {
  id: string;
  user_id: string;
  tone_tier: number;
  skin_type: string;
  concerns: Record<string, number>;
  zone_tags: unknown[];
  health_score: number;
  captured_at: string;
}

export interface LookRequest {
  id: string;
  client_id: string;
  artist_id: string;
  look_id: string;
  look_name: string;
  look_caption: string;
  client_photo_url: string;
  generated_url: string;
  message: string | null;
  status: LookRequestStatus;
  quote: string | null;
  created_at: string;
  viewed_at: string | null;
}

export interface AppointmentProduct {
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

export interface Appointment {
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
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  products: AppointmentProduct[];
}

export interface Product {
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

export interface Invite {
  id: string;
  artist_id: string;
  accepted_by_client_id: string | null;
  client_name: string;
  contact: string;
  channel: string;
  message: string | null;
  code: string;
  status: InviteStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface AuthResponse {
  user: User;
  tokens: { access_token: string; refresh_token: string; token_type: string };
}

export interface CogsSummary {
  appointment_id: string;
  total_cogs: number;
  final_price: number | null;
  gross_margin_pct: number | null;
  products: AppointmentProduct[];
}
