import { Pressable, View } from 'react-native';
import { tokens } from '@softglow/tokens';

interface FacePinProps {
  /** Normalized 0..1 coordinates relative to the portrait. */
  x: number;
  y: number;
  /** Concern count displayed inside the pin. */
  count?: number;
  /** Visual tone — defaults to accent. Severity-derived in practice. */
  tone?: 'accent' | 'warning' | 'danger' | 'neutral';
  selected?: boolean;
  onPress?: () => void;
  size?: number;
}

const toneColor: Record<NonNullable<FacePinProps['tone']>, string> = {
  accent: tokens.colors.accent.primary,
  warning: tokens.colors.state.warning,
  danger: tokens.colors.state.danger,
  neutral: tokens.colors.text.secondary,
};

export function FacePin({
  x,
  y,
  count,
  tone = 'accent',
  selected = false,
  onPress,
  size = 22,
}: FacePinProps) {
  const color = toneColor[tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tag at zone ${count ?? 0} concerns`}
      hitSlop={8}
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: [{ translateX: -size / 2 }, { translateY: -size / 2 }],
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: selected ? 3 : 2,
          borderColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          ...tokens.shadow.sm,
        }}
      >
        {/* Pulse halo when selected */}
        {selected ? (
          <View
            style={{
              position: 'absolute',
              width: size + 14,
              height: size + 14,
              borderRadius: (size + 14) / 2,
              borderWidth: 2,
              borderColor: color,
              opacity: 0.4,
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
