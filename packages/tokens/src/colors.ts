/**
 * Softglow color tokens — the "Lumen Noir" luxury aesthetic.
 *
 * Philosophy:
 * - Black, white, gold, grey. No other hues.
 * - Background is near-white with a hint of warmth.
 * - Hero surfaces are deep charcoal black; gold pops against them.
 * - Gold is reserved for highlights, active indicators, and on-hero CTAs.
 * - Primary buttons are black for high-contrast emphasis in light surfaces.
 */

export const palette = {
  // Warm-neutral scale — backgrounds + surfaces
  bone: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
  // Cool neutral / type scale
  ink: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  // Luxury gold — the only chromatic accent
  gold: {
    50: '#FBF6E5',
    100: '#F5EBC2',
    200: '#EBD58A',
    300: '#DFC05A',
    400: '#D4AF37', // primary gold
    500: '#C29D2F',
    600: '#A88727',
    700: '#856A1F',
    800: '#604D17',
    900: '#3D310F',
  },
  // Semantic accents (used sparingly, desaturated to fit the palette)
  success: '#4F7A5E',
  warning: '#D4AF37',
  danger: '#A8423A',
  info: '#5B6E80',
  // Pure scaffolding
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/**
 * Semantic tokens — UI code references these, never raw palette values.
 * This indirection lets us re-skin without touching components.
 */
export const semanticColors = {
  background: {
    base: palette.bone[50],
    raised: palette.white,
    sunken: palette.bone[100],
    inverse: palette.ink[900],
  },
  surface: {
    glass: 'rgba(255, 255, 255, 0.62)',
    glassStrong: 'rgba(255, 255, 255, 0.80)',
    glassMuted: 'rgba(255, 255, 255, 0.38)',
    solid: palette.white,
    hero: palette.ink[900],
  },
  text: {
    primary: palette.ink[900],
    secondary: palette.ink[600],
    tertiary: palette.ink[500],
    inverse: palette.ink[50],
    onHero: palette.white,
    accent: palette.gold[600],
  },
  border: {
    subtle: 'rgba(23, 23, 23, 0.06)',
    default: 'rgba(23, 23, 23, 0.10)',
    strong: 'rgba(23, 23, 23, 0.16)',
    onGlass: 'rgba(255, 255, 255, 0.45)',
  },
  accent: {
    primary: palette.gold[400],
    primaryHover: palette.gold[500],
    primaryPressed: palette.gold[600],
    primarySoft: 'rgba(212, 175, 55, 0.14)',
  },
  state: {
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,
  },
} as const;

export type Palette = typeof palette;
export type SemanticColors = typeof semanticColors;
