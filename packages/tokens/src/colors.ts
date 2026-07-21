/**
 * SuperGlam color tokens — "The Vanity" design system.
 *
 * Philosophy:
 * - Warm, intimate, editorial. Feels like a warmly-lit atelier, not a drugstore.
 * - Vellum base keeps everything soft. Espresso anchors depth.
 * - Rose Clay is the primary action color — warm, confident, never harsh.
 * - Champagne accents shop highlights and secondary badges.
 * - Sage is reserved for routine/wellness moments only (streaks, completions).
 * - Plum Velvet is sacred — used only for premium/MUA-tier moments.
 *   Its scarcity is what makes it feel elevated, never use it for UI chrome.
 */

export const palette = {
  // Base scale — warm off-whites to deep espresso
  vellum: {
    50:  '#FDFAF6',  // near-white, primary app background
    100: '#FAF6F1',  // Vellum — card surfaces
    200: '#F3EBE0',  // input backgrounds, sunken surfaces
    300: '#E4D9CD',  // Sand — dividers, borders
    400: '#D4C4B4',  // mid-neutral
    500: '#BDA898',  // muted elements
    600: '#9A8070',  // secondary text
    700: '#7A6050',  // strong neutral text
    800: '#4A3A30',  // near-espresso
    900: '#2B211D',  // Espresso — darkest
  },
  // Primary action — Rose Clay
  roseClay: {
    50:  '#FDF0ED',
    100: '#FADED8',
    200: '#F4B8AD',
    300: '#E99482',
    400: '#C97B6A',  // Rose Clay — primary
    500: '#B5634F',
    600: '#9A4D3C',
    700: '#8A4A3E',  // Umber Rose — pressed states
    800: '#6B3530',
    900: '#4D2320',
  },
  // Secondary accent — Champagne
  champagne: {
    50:  '#FDF8F0',
    100: '#FAF0E0',
    200: '#F4DDB8',
    300: '#ECC98E',
    400: '#E8C79A',  // Champagne — secondary
    500: '#D4AE7A',
    600: '#B8915A',
    700: '#967040',
    800: '#6E4F28',
    900: '#4A3218',
  },
  // Wellness / routine — Sage
  sage: {
    50:  '#F2F5F0',
    100: '#E5EBE2',
    200: '#C8D4C2',
    300: '#AABBAA',
    400: '#8A9A7E',  // Sage — routine/streak
    500: '#758567',
    600: '#5E6B52',
    700: '#49533E',
    800: '#353C2C',
    900: '#22261C',
  },
  // Premium / MUA-tier — Plum Velvet (use sparingly)
  plum: {
    50:  '#F5EFF3',
    100: '#EBDFE7',
    200: '#D5BECE',
    300: '#B990AE',
    400: '#8E5A7E',
    500: '#5B2A4A',  // Plum Velvet — premium only
    600: '#4A2040',
    700: '#3A1832',
    800: '#2A1024',
    900: '#1A0A18',
  },
  // Semantic
  success: '#8A9A7E',   // Sage-based success
  warning: '#E8C79A',   // Champagne-based warning
  danger:  '#A8423A',
  info:    '#5B6E80',
  white:   '#FFFFFF',
  black:   '#000000',
  transparent: 'transparent',
} as const;

/**
 * Semantic tokens — all UI code references these, never raw palette values.
 */
export const semanticColors = {
  background: {
    base:    palette.vellum[50],   // primary screen background
    raised:  palette.vellum[100],  // card / sheet surfaces
    sunken:  palette.vellum[200],  // input, tag, chip backgrounds
    inverse: palette.vellum[900],  // Espresso — hero/dark surfaces
  },
  surface: {
    solid:      palette.white,
    glass:      'rgba(253, 250, 246, 0.72)',   // warm glass overlay
    glassStrong:'rgba(253, 250, 246, 0.88)',
    glassMuted: 'rgba(253, 250, 246, 0.42)',
    hero:       palette.vellum[900],
  },
  text: {
    primary:   palette.vellum[900],  // Espresso — main body text
    secondary: palette.vellum[600],  // Warm Charcoal mid
    tertiary:  palette.vellum[500],  // muted / placeholder
    inverse:   palette.vellum[50],   // text on dark/hero surfaces
    onHero:    palette.white,
    accent:    palette.roseClay[400],
    accentOnHero: palette.champagne[300],
    premium:   palette.plum[500],    // Plum Velvet — MUA-tier labels only
    wellness:  palette.sage[600],    // Sage — routine labels only
  },
  border: {
    subtle:  'rgba(43, 33, 29, 0.06)',   // Espresso-tinted hairlines
    default: 'rgba(43, 33, 29, 0.10)',
    strong:  'rgba(43, 33, 29, 0.18)',
    sand:    palette.vellum[300],        // Sand — explicit dividers
    onGlass: 'rgba(255, 255, 255, 0.45)',
  },
  accent: {
    // Primary: Rose Clay
    primary:        palette.roseClay[400],
    primaryHover:   palette.roseClay[500],
    primaryPressed: palette.roseClay[700],
    primarySoft:    'rgba(201, 123, 106, 0.12)',
    // Secondary: Champagne
    secondary:      palette.champagne[400],
    secondarySoft:  'rgba(232, 199, 154, 0.18)',
    // Premium: Plum Velvet (use only for MUA/booking/premium moments)
    premium:        palette.plum[500],
    premiumSoft:    'rgba(91, 42, 74, 0.10)',
    // Wellness: Sage (only for routine/streak moments)
    wellness:       palette.sage[400],
    wellnessSoft:   'rgba(138, 154, 126, 0.15)',
  },
  state: {
    success: palette.success,
    warning: palette.warning,
    danger:  palette.danger,
    info:    palette.info,
  },
} as const;

export type Palette = typeof palette;
export type SemanticColors = typeof semanticColors;
