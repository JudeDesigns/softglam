import { View, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps extends ViewProps {
  label: string;
  tone?: Tone;
}

const colorMap: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: 'rgba(79, 122, 94, 0.14)', fg: tokens.colors.state.success },
  warning: { bg: 'rgba(212, 175, 55, 0.16)', fg: tokens.palette.gold[700] },
  danger: { bg: 'rgba(168, 66, 58, 0.14)', fg: tokens.colors.state.danger },
  info: { bg: 'rgba(91, 110, 128, 0.14)', fg: tokens.colors.state.info },
  accent: { bg: tokens.colors.accent.primarySoft, fg: tokens.colors.text.accent },
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
