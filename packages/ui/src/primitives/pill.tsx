import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'onHero';

interface PillProps extends ViewProps {
  label?: string;
  tone?: Tone;
  children?: ReactNode;
  /** Compact = sm height; comfy = md height. */
  size?: 'sm' | 'md';
}

const bgMap: Record<Tone, string> = {
  neutral: tokens.colors.background.sunken,
  accent: tokens.colors.accent.primarySoft,
  success: 'rgba(63, 166, 107, 0.14)',
  warning: 'rgba(224, 168, 46, 0.16)',
  danger: 'rgba(216, 69, 58, 0.14)',
  onHero: 'rgba(255, 255, 255, 0.18)',
};

const fgMap: Record<Tone, 'primary' | 'accent' | 'onHero' | 'secondary'> = {
  neutral: 'secondary',
  accent: 'accent',
  success: 'primary',
  warning: 'primary',
  danger: 'primary',
  onHero: 'onHero',
};

export function Pill({ label, tone = 'neutral', size = 'sm', children, style, ...rest }: PillProps) {
  const paddingVertical = size === 'sm' ? tokens.spacing[1] : tokens.spacing[2];
  const paddingHorizontal = size === 'sm' ? tokens.spacing[3] : tokens.spacing[4];

  return (
    <View
      {...rest}
      style={[
        {
          paddingVertical,
          paddingHorizontal,
          borderRadius: tokens.radii.pill,
          backgroundColor: bgMap[tone],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {label ? (
        <Text variant="label" tone={fgMap[tone]}>
          {label}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
