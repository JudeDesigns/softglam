import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { tokens } from '@softglow/tokens';

export type IconButtonVariant = 'solid' | 'soft' | 'ghost' | 'onHero';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  accessibilityLabel: string;
}

const sizeMap: Record<IconButtonSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

interface VariantPalette {
  bg: string;
  bgPressed: string;
  border?: string;
}

const variantPalettes: Record<IconButtonVariant, VariantPalette> = {
  solid: {
    bg: tokens.colors.surface.solid,
    bgPressed: tokens.colors.background.sunken,
    border: tokens.colors.border.default,
  },
  soft: {
    bg: tokens.colors.background.sunken,
    bgPressed: tokens.colors.background.raised,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: tokens.colors.background.sunken,
  },
  onHero: {
    bg: 'rgba(255, 255, 255, 0.18)',
    bgPressed: 'rgba(255, 255, 255, 0.30)',
    border: 'rgba(255, 255, 255, 0.32)',
  },
};

export function IconButton({
  icon,
  variant = 'soft',
  size = 'md',
  disabled,
  accessibilityLabel,
  ...rest
}: IconButtonProps) {
  const isDisabled = disabled === true;
  const dim = sizeMap[size];
  const palette = variantPalettes[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={8}
      {...rest}
      style={({ pressed }) => {
        const base: ViewStyle = {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          opacity: isDisabled ? 0.5 : 1,
          ...(palette.border ? { borderWidth: 1, borderColor: palette.border } : null),
        };
        return base;
      }}
    >
      {icon}
    </Pressable>
  );
}
