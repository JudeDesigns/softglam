/**
 * SoftGlow color tokens — the "Lumen" aesthetic.
 *
 * Philosophy:
 * - Background is a warm sterile off-white (sand/bone), not pure white.
 * - Surfaces are semi-transparent for glassmorphism.
 * - Vibrant orange is reserved for active states, primary CTAs, and hero data.
 * - Cool grays carry the type hierarchy.
 */

export const palette = {
  // Neutral warm-bone scale (backgrounds + surfaces)
  bone: {
    50: '#FBF9F6',
    100: '#F4F1EC',
    200: '#ECE7E0',
    300: '#DDD6CC',
    400: '#C4BBAE',
    500: '#9C9183',
    600: '#6E6557',
    700: '#4A4338',
    800: '#2C271F',
    900: '#171410',
  },
  // Cool gray scale (type + iconography)
  ink: {
    50: '#F6F7F8',
    100: '#E9EAEC',
    200: '#D2D5D9',
    300: '#A8ADB4',
    400: '#7B8189',
    500: '#565C64',
    600: '#3D424A',
    700: '#272B31',
    800: '#16181C',
    900: '#0A0B0D',
  },
  // Vibrant orange — Lumen primary
  flame: {
    50: '#FFF3EA',
    100: '#FFE2CB',
    200: '#FFC393',
    300: '#FFA15A',
    400: '#FF8530',
    500: '#F77A1C', // primary
    600: '#E0640E',
    700: '#B44E0A',
    800: '#7D3607',
    900: '#4A2004',
  },
  // Semantic accents (used sparingly)
  success: '#3FA66B',
  warning: '#E0A82E',
  danger: '#D8453A',
  info: '#4A90C9',
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
    base: palette.bone[100],
    raised: palette.bone[50],
    sunken: palette.bone[200],
    inverse: palette.ink[900],
  },
  surface: {
    glass: 'rgba(255, 255, 255, 0.55)',
    glassStrong: 'rgba(255, 255, 255, 0.72)',
    glassMuted: 'rgba(255, 255, 255, 0.35)',
    solid: palette.white,
    hero: palette.flame[500],
  },
  text: {
    primary: palette.ink[900],
    secondary: palette.ink[500],
    tertiary: palette.ink[400],
    inverse: palette.bone[50],
    onHero: palette.white,
    accent: palette.flame[600],
  },
  border: {
    subtle: 'rgba(15, 17, 21, 0.06)',
    default: 'rgba(15, 17, 21, 0.10)',
    strong: 'rgba(15, 17, 21, 0.16)',
    onGlass: 'rgba(255, 255, 255, 0.45)',
  },
  accent: {
    primary: palette.flame[500],
    primaryHover: palette.flame[600],
    primaryPressed: palette.flame[700],
    primarySoft: palette.flame[100],
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
