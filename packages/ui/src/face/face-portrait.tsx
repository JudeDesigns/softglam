import { useState, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
  Circle,
} from 'react-native-svg';
import { tokens } from '@softglow/tokens';

interface FacePortraitProps extends Omit<ViewProps, 'children'> {
  /** Width in px; height is auto from the 240×320 aspect ratio. */
  width?: number;
  children?: ReactNode;
  /** Emits normalized (0..1) coordinates of the tap on the face. */
  onTap?: (x: number, y: number) => void;
}

/**
 * Neutral line-art face used by the Smart Reticle. Drawn in a 240×320 viewBox
 * so children can position pins using normalized 0..1 coordinates and the
 * markup stays resolution-independent.
 */
export function FacePortrait({ width = 280, children, onTap, style, ...rest }: FacePortraitProps) {
  const height = (width * 320) / 240;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <View
      {...rest}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
      onStartShouldSetResponder={() => onTap !== undefined}
      onResponderRelease={(e) => {
        if (!onTap || !size) return;
        const x = Math.max(0, Math.min(1, e.nativeEvent.locationX / size.w));
        const y = Math.max(0, Math.min(1, e.nativeEvent.locationY / size.h));
        onTap(x, y);
      }}
      style={[
        { width, height, position: 'relative', alignSelf: 'center' },
        style,
      ]}
    >
      <Svg width={width} height={height} viewBox="0 0 240 320">
        <Defs>
          <LinearGradient id="faceFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FBF9F6" />
            <Stop offset="1" stopColor="#ECE7E0" />
          </LinearGradient>
        </Defs>
        {/* Head oval */}
        <Ellipse
          cx="120"
          cy="160"
          rx="92"
          ry="130"
          fill="url(#faceFill)"
          stroke={tokens.colors.border.strong}
          strokeWidth="1.5"
        />
        {/* Hairline arc */}
        <Path
          d="M 36 110 Q 120 30 204 110"
          stroke={tokens.colors.border.default}
          strokeWidth="1.2"
          fill="none"
        />
        {/* Brows */}
        <Path d="M 70 140 Q 90 132 108 140" stroke="#3D424A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M 132 140 Q 150 132 170 140" stroke="#3D424A" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        <G fill="#3D424A">
          <Ellipse cx="89" cy="162" rx="6" ry="3" />
          <Ellipse cx="151" cy="162" rx="6" ry="3" />
        </G>
        {/* Nose */}
        <Path d="M 120 168 Q 116 200 126 214 Q 122 220 116 218" stroke={tokens.colors.border.strong} strokeWidth="1.2" fill="none" />
        {/* Mouth */}
        <Path d="M 100 248 Q 120 258 140 248" stroke="#3D424A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* Cheek hint circles (very subtle) */}
        <Circle cx="76" cy="200" r="14" fill="rgba(247, 122, 28, 0.05)" />
        <Circle cx="164" cy="200" r="14" fill="rgba(247, 122, 28, 0.05)" />
      </Svg>
      {children}
    </View>
  );
}

export type FaceZoneName =
  | 'forehead'
  | 'leftBrow'
  | 'rightBrow'
  | 'leftCheek'
  | 'rightCheek'
  | 'nose'
  | 'leftUndereye'
  | 'rightUndereye'
  | 'chin'
  | 'mouth'
  | 'jaw';

/**
 * Heuristic zone classifier given a normalized tap position. Used to label
 * tags ("Left cheek") without forcing the user to specify the zone manually.
 */
export function classifyZone(x: number, y: number): FaceZoneName {
  if (y < 0.32) return 'forehead';
  if (y < 0.45) return x < 0.5 ? 'leftBrow' : 'rightBrow';
  if (y < 0.58) return x < 0.5 ? 'leftUndereye' : 'rightUndereye';
  if (y < 0.72) {
    if (x < 0.38) return 'leftCheek';
    if (x > 0.62) return 'rightCheek';
    return 'nose';
  }
  if (y < 0.82) return 'mouth';
  if (y < 0.92) return 'chin';
  return 'jaw';
}

export const ZONE_LABELS: Record<FaceZoneName, string> = {
  forehead: 'Forehead',
  leftBrow: 'Left brow',
  rightBrow: 'Right brow',
  leftCheek: 'Left cheek',
  rightCheek: 'Right cheek',
  nose: 'Nose / T-zone',
  leftUndereye: 'Left under-eye',
  rightUndereye: 'Right under-eye',
  chin: 'Chin',
  mouth: 'Mouth area',
  jaw: 'Jaw',
};
