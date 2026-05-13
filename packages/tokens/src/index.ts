export * from './colors';
export * from './spacing';
export * from './typography';
export * from './effects';

import { palette, semanticColors } from './colors';
import { spacing, radii } from './spacing';
import { fontFamily, fontSize, lineHeight, fontWeight, letterSpacing } from './typography';
import { blur, shadow, duration, easing } from './effects';

export const tokens = {
  palette,
  colors: semanticColors,
  spacing,
  radii,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  blur,
  shadow,
  duration,
  easing,
} as const;

export type Tokens = typeof tokens;
