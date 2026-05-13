import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { tokens } from '@softglow/tokens';

type Elevation = 'none' | 'sm' | 'md' | 'lg' | 'hero';
type Radius = keyof typeof tokens.radii;
type Surface = 'solid' | 'sunken' | 'hero';

interface CardProps extends ViewProps {
  children: ReactNode;
  padding?: number;
  radius?: Radius;
  elevation?: Elevation;
  surface?: Surface;
  borderless?: boolean;
}

const surfaceMap: Record<Surface, string> = {
  solid: tokens.colors.surface.solid,
  sunken: tokens.colors.background.sunken,
  hero: tokens.colors.surface.hero,
};

export function Card({
  children,
  padding = tokens.spacing[5],
  radius = 'xl',
  elevation = 'sm',
  surface = 'solid',
  borderless = false,
  style,
  ...rest
}: CardProps) {
  const containerStyle: ViewStyle = {
    backgroundColor: surfaceMap[surface],
    borderRadius: tokens.radii[radius],
    padding,
    ...(borderless ? null : { borderWidth: 1, borderColor: tokens.colors.border.subtle }),
    ...tokens.shadow[elevation],
  };

  return (
    <View {...rest} style={[containerStyle, style]}>
      {children}
    </View>
  );
}
