/**
 * Inter is the primary face. We expose font-family names that match the
 * @expo-google-fonts/inter package keys used in the Expo app.
 */
export const fontFamily = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
  '4xl': 44,
  '5xl': 56,
} as const;

export const lineHeight = {
  xs: 14,
  sm: 18,
  base: 22,
  md: 24,
  lg: 26,
  xl: 30,
  '2xl': 34,
  '3xl': 40,
  '4xl': 50,
  '5xl': 62,
} as const;

export const letterSpacing = {
  tighter: -0.6,
  tight: -0.3,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
