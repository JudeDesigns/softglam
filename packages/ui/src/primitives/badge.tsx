import { View, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps extends ViewProps {
  label: string;
  tone?: Tone;
  /** Lift contrast for use on dark/hero surfaces. */
  onHero?: boolean;
}

const colorMap: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: 'rgba(138, 154, 126, 0.16)', fg: tokens.colors.state.success },
  warning: { bg: 'rgba(232, 199, 154, 0.25)', fg: '#967040' },
  danger:  { bg: 'rgba(168, 66, 58, 0.14)',   fg: tokens.colors.state.danger },
  info:    { bg: 'rgba(91, 110, 128, 0.14)',   fg: tokens.colors.state.info },
  accent:  { bg: tokens.colors.accent.primarySoft, fg: tokens.colors.accent.primary },
};

const onHeroColorMap: Partial<Record<Tone, { bg: string; fg: string }>> = {
  accent: { bg: 'rgba(201, 123, 106, 0.22)', fg: tokens.colors.text.accentOnHero },
};

export function Badge({ label, tone = 'accent', onHero = false, style, ...rest }: BadgeProps) {
  const { bg, fg } = (onHero && onHeroColorMap[tone]) || colorMap[tone];
  return (
    <View
      {...rest}
      style={[
        {
          paddingVertical: tokens.spacing[1],
          paddingHorizontal: tokens.spacing[2],
          borderRadius: tokens.radii.sm,
          backgroundColor: bg,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant="caption" style={{ color: fg, fontFamily: tokens.fontFamily.sansSemibold, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
