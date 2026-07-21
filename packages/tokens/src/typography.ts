/**
 * Typography tokens — "The Vanity" design system.
 *
 * Two-face system:
 * - Serif (Playfair Display): display titles, AI look reveal headline,
 *   artist names in booking/chat. Reserved for emotional, personal moments.
 *   NEVER use serif in buttons, tab bars, form labels, or dense UI chrome.
 * - Sans (Inter): everything functional — buttons, lists, form fields,
 *   chat bubbles, tab bar labels, body copy.
 *
 * This restraint is what prevents it from feeling like a wedding invite.
 */
export const fontFamily = {
  // Sans — functional UI
  sans:        'Inter_400Regular',
  sansMedium:  'Inter_500Medium',
  sansSemibold:'Inter_600SemiBold',
  sansBold:    'Inter_700Bold',
  // Serif — editorial / emotional display moments only
  serif:       'PlayfairDisplay_400Regular',
  serifMedium: 'PlayfairDisplay_500Medium',
  serifSemibold:'PlayfairDisplay_600SemiBold',
  serifBold:   'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
} as const;

export const fontWeight = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
} as const;

export const fontSize = {
  xs:   12,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   22,
  '2xl':28,
  '3xl':34,
  '4xl':44,
  '5xl':56,
} as const;

export const lineHeight = {
  xs:   16,
  sm:   18,
  base: 22,
  md:   24,
  lg:   28,
  xl:   30,
  '2xl':36,
  '3xl':42,
  '4xl':52,
  '5xl':64,
} as const;

export const letterSpacing = {
  tighter: -0.6,
  tight:   -0.3,
  normal:  0,
  wide:    0.3,
  wider:   0.6,
  // Serif display — slightly open tracking looks more editorial
  display: 0.2,
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
