import { View, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';

interface ProgressBarProps extends ViewProps {
  /** 0..1. Clamped. */
  value: number;
  height?: number;
  tone?: 'accent' | 'neutral' | 'success' | 'danger';
}

const toneFill: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  accent: tokens.colors.accent.primary,
  neutral: tokens.colors.text.primary,
  success: tokens.colors.state.success,
  danger: tokens.colors.state.danger,
};

export function ProgressBar({ value, height = 6, tone = 'accent', style, ...rest }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      {...rest}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: tokens.colors.border.subtle,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: toneFill[tone],
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
