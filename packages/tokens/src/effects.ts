/**
 * Visual effects: blur intensities, shadow presets, motion timings.
 * Shadow values are RN-shaped (iOS) with elevation hints (Android).
 */
export const blur = {
  none: 0,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 60,
} as const;

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 34,
    elevation: 10,
  },
  hero: {
    shadowColor: '#F77A1C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 14,
  },
} as const;

export const duration = {
  instant: 80,
  fast: 160,
  base: 240,
  slow: 360,
  slower: 540,
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0, 1)',
  accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

export type Blur = typeof blur;
export type Shadow = typeof shadow;
