import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { tokens } from '@softglow/tokens';

export type TextVariant =
  | 'display'
  | 'title'
  | 'titleSm'
  | 'heading'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'caption';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'accent'
  | 'accentOnHero'
  | 'onHero';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: tokens.fontFamily.sansBold,
    fontSize: tokens.fontSize['4xl'],
    lineHeight: tokens.lineHeight['4xl'],
    letterSpacing: tokens.letterSpacing.tighter,
  },
  title: {
    fontFamily: tokens.fontFamily.sansBold,
    fontSize: tokens.fontSize['3xl'],
    lineHeight: tokens.lineHeight['3xl'],
    letterSpacing: tokens.letterSpacing.tight,
  },
  titleSm: {
    fontFamily: tokens.fontFamily.sansSemibold,
    fontSize: tokens.fontSize['2xl'],
    lineHeight: tokens.lineHeight['2xl'],
    letterSpacing: tokens.letterSpacing.tight,
  },
  heading: {
    fontFamily: tokens.fontFamily.sansSemibold,
    fontSize: tokens.fontSize.lg,
    lineHeight: tokens.lineHeight.lg,
  },
  body: {
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.base,
    lineHeight: tokens.lineHeight.base,
  },
  bodySm: {
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.sm,
  },
  label: {
    fontFamily: tokens.fontFamily.sansMedium,
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.sm,
    letterSpacing: tokens.letterSpacing.wide,
  },
  caption: {
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.xs,
    lineHeight: tokens.lineHeight.xs,
  },
};

const toneColors: Record<TextTone, string> = {
  primary:      tokens.colors.text.primary,
  secondary:    tokens.colors.text.secondary,
  tertiary:     tokens.colors.text.tertiary,
  inverse:      tokens.colors.text.inverse,
  accent:       tokens.colors.accent.primary,
  accentOnHero: tokens.colors.text.accentOnHero,
  onHero:       tokens.colors.text.onHero,
};

const weightFamilies: Record<NonNullable<TextProps['weight']>, string> = {
  regular: tokens.fontFamily.sans,
  medium: tokens.fontFamily.sansMedium,
  semibold: tokens.fontFamily.sansSemibold,
  bold: tokens.fontFamily.sansBold,
};

export function Text({
  variant = 'body',
  tone = 'primary',
  weight,
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        variantStyles[variant],
        { color: toneColors[tone] },
        weight ? { fontFamily: weightFamilies[weight] } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
