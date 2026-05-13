import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface MetricPillProps extends ViewProps {
  label: string;
  /** 0..100. Drives the circular progress. */
  value: number;
  /** Optional override for the value's display text. Defaults to `${value}%`. */
  displayValue?: string;
  caption?: string;
  tone?: Tone;
  icon?: ReactNode;
  size?: number;
}

const toneColor: Record<Tone, string> = {
  accent: tokens.colors.accent.primary,
  success: tokens.colors.state.success,
  warning: tokens.colors.state.warning,
  danger: tokens.colors.state.danger,
  neutral: tokens.colors.text.secondary,
};

/**
 * Small circular progress with a label and value, used as the row of "top
 * concerns" beneath the hero gauge. Composes well in a horizontal scroll.
 */
export function MetricPill({
  label,
  value,
  displayValue,
  caption,
  tone = 'accent',
  icon,
  size = 64,
  style,
  ...rest
}: MetricPillProps) {
  const thickness = 6;
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const filled = circumference * (clamped / 100);
  const color = toneColor[tone];

  return (
    <View
      {...rest}
      style={[
        {
          alignItems: 'center',
          gap: tokens.spacing[2],
          paddingHorizontal: tokens.spacing[2],
        },
        style,
      ]}
    >
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={tokens.colors.border.subtle}
            strokeWidth={thickness}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${cx}, ${cy}`}
          />
        </Svg>
        {icon ?? (
          <Text variant="label" weight="semibold" style={{ color }}>
            {displayValue ?? `${Math.round(clamped)}%`}
          </Text>
        )}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text variant="caption" tone="secondary" weight="medium">
          {label}
        </Text>
        {caption ? (
          <Text variant="caption" tone="tertiary">
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
