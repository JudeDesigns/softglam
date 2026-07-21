import type { SkinProfile } from '@softglow/types';

export type HealthBand = 'excellent' | 'good' | 'fair' | 'needsCare';

export function bandForScore(score: number): HealthBand {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'needsCare';
}

export const BAND_COPY: Record<HealthBand, { caption: string; headline: string }> = {
  excellent: { caption: 'Excellent', headline: 'Your skin is thriving' },
  good: { caption: 'Good progress', headline: "You're on a strong streak" },
  fair: { caption: 'A few things to address', headline: 'Small tweaks, big lift' },
  needsCare: { caption: 'Needs some care', headline: "Let's build a gentle routine" },
};

export function summarizeProfile(profile: SkinProfile | null): string {
  if (!profile) return 'Take a 2-minute check-in to see your score.';
  const { caption } = BAND_COPY[bandForScore(profile.healthScore)];
  return caption;
}
