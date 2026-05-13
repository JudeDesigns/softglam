import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '@softglow/tokens';

type Intensity = 'sm' | 'md' | 'lg';
type Tint = 'light' | 'extraLight';
type Radius = keyof typeof tokens.radii;

interface GlassCardProps extends ViewProps {
  children: ReactNode;
  padding?: number;
  radius?: Radius;
  intensity?: Intensity;
  tint?: Tint;
}

const intensityValue: Record<Intensity, number> = {
  sm: 20,
  md: 40,
  lg: 70,
};

const tintFill: Record<Tint, string> = {
  light: tokens.colors.surface.glass,
  extraLight: tokens.colors.surface.glassStrong,
};

/**
 * Frosted-glass surface. Uses native BlurView on iOS; on Android < 31 the
 * blur degrades to a translucent fill which is intentional — we layer a
 * tinted overlay so the visual identity is preserved regardless.
 */
export function GlassCard({
  children,
  padding = tokens.spacing[5],
  radius = 'xl',
  intensity = 'md',
  tint = 'light',
  style,
  ...rest
}: GlassCardProps) {
  const containerStyle: ViewStyle = {
    borderRadius: tokens.radii[radius],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.border.onGlass,
    ...tokens.shadow.md,
  };

  // expo-blur doesn't render well on Android < 31; gate native blur to iOS.
  const useNativeBlur = Platform.OS === 'ios';

  return (
    <View {...rest} style={[containerStyle, style]}>
      {useNativeBlur ? (
        <BlurView intensity={intensityValue[intensity]} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tintFill[tint] },
        ]}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}
