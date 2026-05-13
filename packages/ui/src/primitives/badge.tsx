import { View, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps extends ViewProps {
  label: string;
  tone?: Tone;
}

const colorMap: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: 'rgba(63, 166, 107, 0.16)', fg: tokens.colors.state.success },
  warning: { bg: 'rgba(224, 168, 46, 0.18)', fg: tokens.colors.state.warning },
  danger: { bg: 'rgba(216, 69, 58, 0.16)', fg: tokens.colors.state.danger },
  info: { bg: 'rgba(74, 144, 201, 0.16)', fg: tokens.colors.state.info },
  accent: { bg: tokens.colors.accent.primarySoft, fg: tokens.colors.accent.primary },
};

export function Badge({ label, tone = 'accent', style, ...rest }: BadgeProps) {
  const { bg, fg } = colorMap[tone];
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
      <Text variant="caption" style={{ color: fg, fontFamily: tokens.fontFamily.sansSemibold }}>
        {label}
      </Text>
    </View>
  );
}
