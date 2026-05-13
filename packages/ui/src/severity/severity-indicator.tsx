import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { View, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import type { SeverityLevel, SkinConcern } from '@softglow/types';

interface SeverityIndicatorProps extends ViewProps {
  concern: SkinConcern;
  level: SeverityLevel;
  size?: number;
}

const SKIN_TONE = '#F1D9C2';
const SKIN_TONE_SHADE = '#E5C3A4';

/**
 * Procedural placeholder visualisation per concern at a given severity (0..4).
 * Used in the onboarding quiz where the user picks the tile that matches them.
 * Designed to be swapped for stock photography later without API changes.
 */
export function SeverityIndicator({
  concern,
  level,
  size = 120,
  style,
  ...rest
}: SeverityIndicatorProps) {
  return (
    <View
      {...rest}
      style={[
        {
          width: size,
          height: size,
          borderRadius: tokens.radii.lg,
          overflow: 'hidden',
          backgroundColor: SKIN_TONE,
        },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="skinShade" cx="50%" cy="40%" r="65%">
            <Stop offset="0%" stopColor={SKIN_TONE} />
            <Stop offset="100%" stopColor={SKIN_TONE_SHADE} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#skinShade)" />
        {renderOverlay(concern, level)}
      </Svg>
    </View>
  );
}

function renderOverlay(concern: SkinConcern, level: SeverityLevel) {
  switch (concern) {
    case 'acne':
      return <AcneOverlay level={level} />;
    case 'dryness':
      return <DrynessOverlay level={level} />;
    case 'oiliness':
      return <OilinessOverlay level={level} />;
    case 'redness':
      return <RednessOverlay level={level} />;
    case 'darkCircles':
      return <DarkCirclesOverlay level={level} />;
    case 'pores':
      return <PoresOverlay level={level} />;
    case 'sensitivity':
      return <SensitivityOverlay level={level} />;
  }
}

// Deterministic pseudo-random positions in 0..100 space.
const SEEDS: Array<[number, number]> = [
  [22, 28], [58, 18], [78, 36], [34, 52], [68, 60],
  [16, 70], [82, 78], [48, 84], [40, 14], [62, 44],
  [28, 62], [72, 22], [12, 44], [88, 56], [50, 32],
  [36, 76], [64, 78], [54, 60], [24, 18], [88, 30],
];

function AcneOverlay({ level }: { level: SeverityLevel }) {
  const count = level * 4;
  return (
    <G opacity={0.9}>
      {SEEDS.slice(0, count).map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.6 + (i % 3) * 0.6} fill="#C0463A" />
      ))}
    </G>
  );
}

function DrynessOverlay({ level }: { level: SeverityLevel }) {
  const count = level * 5;
  return (
    <G opacity={0.5}>
      {SEEDS.slice(0, count).map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width={6 + (i % 4)} height={0.6} fill="#A8856A" rx={0.3} />
      ))}
    </G>
  );
}

function OilinessOverlay({ level }: { level: SeverityLevel }) {
  const opacity = 0.08 + level * 0.14;
  return (
    <G>
      <Ellipse cx="40" cy="30" rx="14" ry="6" fill="#FFFFFF" opacity={opacity} />
      <Ellipse cx="70" cy="50" rx="10" ry="4" fill="#FFFFFF" opacity={opacity} />
      <Ellipse cx="50" cy="70" rx="16" ry="6" fill="#FFFFFF" opacity={opacity * 0.8} />
    </G>
  );
}

function RednessOverlay({ level }: { level: SeverityLevel }) {
  const opacity = level * 0.14;
  return (
    <Rect x="0" y="0" width="100" height="100" fill="#D8453A" opacity={opacity} />
  );
}

function DarkCirclesOverlay({ level }: { level: SeverityLevel }) {
  const opacity = level * 0.18;
  return (
    <>
      <Defs>
        <LinearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3D3A55" stopOpacity={opacity} />
          <Stop offset="1" stopColor="#3D3A55" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="55" fill="url(#dcGrad)" />
    </>
  );
}

function PoresOverlay({ level }: { level: SeverityLevel }) {
  const count = level * 5;
  return (
    <G opacity={0.55}>
      {SEEDS.slice(0, count).map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={0.7} fill="#7A5A47" />
      ))}
    </G>
  );
}

function SensitivityOverlay({ level }: { level: SeverityLevel }) {
  const opacity = level * 0.18;
  return (
    <>
      <Defs>
        <RadialGradient id="sensGrad" cx="50%" cy="50%" r="55%">
          <Stop offset="0%" stopColor="#A8423A" stopOpacity={opacity} />
          <Stop offset="100%" stopColor="#A8423A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#sensGrad)" />
    </>
  );
}
