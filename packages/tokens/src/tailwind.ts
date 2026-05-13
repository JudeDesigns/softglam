/**
 * Adapter that flattens design tokens into the shape Tailwind/NativeWind expect.
 * Consumed by apps/mobile/tailwind.config.js.
 */
import { palette, semanticColors } from './colors';
import { spacing, radii } from './spacing';
import { fontSize, lineHeight, fontFamily, letterSpacing } from './typography';

export const tailwindTheme = {
  colors: {
    transparent: 'transparent',
    current: 'currentColor',
    white: palette.white,
    black: palette.black,
    bone: palette.bone,
    ink: palette.ink,
    gold: palette.gold,
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,
    // Semantic aliases — preferred in app code
    bg: semanticColors.background,
    surface: semanticColors.surface,
    fg: semanticColors.text,
    accent: semanticColors.accent,
    line: semanticColors.border,
  },
  spacing: spacingToTailwind(spacing),
  borderRadius: radiiToTailwind(radii),
  fontSize: fontSizeToTailwind(fontSize, lineHeight),
  fontFamily: {
    sans: [fontFamily.sans],
    medium: [fontFamily.sansMedium],
    semibold: [fontFamily.sansSemibold],
    bold: [fontFamily.sansBold],
  },
  letterSpacing: {
    tighter: `${letterSpacing.tighter}px`,
    tight: `${letterSpacing.tight}px`,
    normal: `${letterSpacing.normal}px`,
    wide: `${letterSpacing.wide}px`,
    wider: `${letterSpacing.wider}px`,
  },
};

function spacingToTailwind(s: typeof spacing): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(s)) {
    out[k] = `${v}px`;
  }
  return out;
}

function radiiToTailwind(r: typeof radii): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = typeof v === 'number' ? `${v}px` : `${v}`;
  }
  return out;
}

function fontSizeToTailwind(
  sizes: typeof fontSize,
  lh: typeof lineHeight,
): Record<string, [string, { lineHeight: string }]> {
  const out: Record<string, [string, { lineHeight: string }]> = {};
  for (const key of Object.keys(sizes) as Array<keyof typeof fontSize>) {
    const lineHeightValue = (lh as Record<string, number>)[key] ?? sizes[key] * 1.4;
    out[key] = [`${sizes[key]}px`, { lineHeight: `${lineHeightValue}px` }];
  }
  return out;
}
