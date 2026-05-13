import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

type Tone = 'accent' | 'success' | 'danger' | 'neutral';

interface RadialGaugeProps extends ViewProps {
  /** 0..100. Clamped. */
  value: number;
  /** Diameter in px. */
  size?: number;
  thickness?: number;
  tone?: Tone;
  label?: string;
  caption?: string;
  children?: ReactNode;
  /** Background ring color. Defaults to a translucent token. */
  trackColor?: string;
  /** Place text content over a hero (orange) surface. */
  onHero?: boolean;
}

const gradientByTone: Record<Tone, [string, string]> = {
  accent: ['#FFA15A', '#F77A1C'],
  success: ['#5BC788', '#3FA66B'],
  danger: ['#E26A60', '#D8453A'],
  neutral: ['#A8ADB4', '#565C64'],
};

/**
 * Circular gauge for the Skin Health Score. Renders a 270° arc starting at
 * the south-west (matching the Lumen reference) and fills clockwise.
 */
export function RadialGauge({
  value,
  size = 220,
  thickness = 16,
  tone = 'accent',
  label,
  caption,
  children,
  trackColor,
  onHero = false,
  style,
  ...rest
}: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const sweep = 0.78; // fraction of the full circle the arc occupies
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * sweep;
  const filled = arcLength * (clamped / 100);

  // Rotate so the arc starts at the south-west and ends at the south-east.
  const rotation = 90 + ((1 - sweep) / 2) * 360;
  const gradId = `gauge-grad-${tone}`;
  const [c0, c1] = gradientByTone[tone];

  const resolvedTrack =
    trackColor ?? (onHero ? 'rgba(255, 255, 255, 0.22)' : tokens.colors.border.subtle);

  return (
    <View
      {...rest}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c0} />
            <Stop offset="1" stopColor={c1} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={resolvedTrack}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          rotation={rotation}
          origin={`${cx}, ${cy}`}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          rotation={rotation}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children ?? (
          <>
            {label ? (
              <Text variant="caption" tone={onHero ? 'onHero' : 'secondary'} weight="medium">
                {label}
              </Text>
            ) : null}
            <Text variant="display" tone={onHero ? 'onHero' : 'primary'}>
              {Math.round(clamped)}
            </Text>
            {caption ? (
              <Text variant="caption" tone={onHero ? 'onHero' : 'tertiary'}>
                {caption}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
