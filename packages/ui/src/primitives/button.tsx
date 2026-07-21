import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text, type TextTone } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'onHero';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const sizeMap: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; minHeight: number; gap: number }> = {
  sm: { paddingVertical: tokens.spacing[2], paddingHorizontal: tokens.spacing[4], minHeight: 36, gap: tokens.spacing[2] },
  md: { paddingVertical: tokens.spacing[3], paddingHorizontal: tokens.spacing[5], minHeight: 48, gap: tokens.spacing[2] },
  lg: { paddingVertical: tokens.spacing[4], paddingHorizontal: tokens.spacing[6], minHeight: 56, gap: tokens.spacing[3] },
};

interface VariantPalette {
  bg: string;
  bgPressed: string;
  fg: TextTone;
  border?: string;
  spinner: string;
}

const variantPalettes: Record<ButtonVariant, VariantPalette> = {
  primary: {
    bg: tokens.colors.accent.primary,
    bgPressed: tokens.colors.accent.primaryPressed,
    fg: 'onHero',
    spinner: tokens.colors.text.onHero,
  },
  secondary: {
    bg: tokens.colors.surface.solid,
    bgPressed: tokens.colors.background.sunken,
    fg: 'primary',
    border: tokens.colors.border.default,
    spinner: tokens.colors.text.primary,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: tokens.colors.background.sunken,
    fg: 'primary',
    spinner: tokens.colors.text.primary,
  },
  destructive: {
    bg: tokens.colors.state.danger,
    bgPressed: '#8A352E',
    fg: 'onHero',
    spinner: tokens.colors.text.onHero,
  },
  onHero: {
    bg: tokens.colors.accent.primary,
    bgPressed: tokens.colors.accent.primaryPressed,
    fg: 'primary',
    spinner: tokens.colors.text.primary,
  },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  ...rest
}: ButtonProps) {
  const sizing = sizeMap[size];
  const palette = variantPalettes[variant];

  // Visual styles live on the inner View so the background always paints
  // even when the React Compiler hoists the Pressable's children/style. The
  // Pressable just owns layout (stretch when fullWidth) and disabled opacity.
  const outerStyle: ViewStyle = {
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled ? 0.65 : 1,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
      {...rest}
      style={outerStyle}
    >
      {({ pressed }) => (
        <View
          style={{
            paddingVertical: sizing.paddingVertical,
            paddingHorizontal: sizing.paddingHorizontal,
            minHeight: sizing.minHeight,
            borderRadius: tokens.radii.pill,
            backgroundColor: pressed ? palette.bgPressed : palette.bg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: sizing.gap,
            ...(palette.border ? { borderWidth: 1, borderColor: palette.border } : null),
            ...(variant === 'primary' && !disabled ? tokens.shadow.sm : null),
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={palette.spinner} />
          ) : (
            <>
              {leadingIcon ? <View>{leadingIcon}</View> : null}
              <Text
                variant={size === 'lg' ? 'heading' : 'label'}
                tone={palette.fg}
                weight="semibold"
              >
                {label}
              </Text>
              {trailingIcon ? <View>{trailingIcon}</View> : null}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
