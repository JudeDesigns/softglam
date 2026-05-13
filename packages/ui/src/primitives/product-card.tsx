import { Image, Pressable, View, type ImageSourcePropType, type PressableProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';
import { Badge } from './badge';

interface ProductCardProps extends Omit<PressableProps, 'children' | 'style'> {
  name: string;
  brand?: string;
  /** Formatted price string, e.g. "$28.00". Caller controls currency/locale. */
  price: string;
  image?: ImageSourcePropType;
  badge?: { label: string; tone?: 'accent' | 'success' | 'warning' | 'info' };
  width?: number;
  variant?: 'tile' | 'row';
}

/**
 * Two layouts in one component: a tile (default, for carousels) and a row
 * (compact, for cart/checkout). The tile is what the Lumen home feed uses.
 */
export function ProductCard({
  name,
  brand,
  price,
  image,
  badge,
  width = 168,
  variant = 'tile',
  ...rest
}: ProductCardProps) {
  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        {...rest}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.spacing[3],
          padding: tokens.spacing[3],
          borderRadius: tokens.radii.lg,
          backgroundColor: tokens.colors.surface.solid,
          borderWidth: 1,
          borderColor: tokens.colors.border.subtle,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: tokens.radii.md,
            backgroundColor: tokens.colors.background.sunken,
            overflow: 'hidden',
          }}
        >
          {image ? <Image source={image} style={{ width: 64, height: 64 }} /> : null}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          {brand ? (
            <Text variant="caption" tone="tertiary" weight="medium">
              {brand.toUpperCase()}
            </Text>
          ) : null}
          <Text variant="bodySm" weight="semibold" numberOfLines={2}>
            {name}
          </Text>
        </View>
        <Text variant="bodySm" weight="semibold">
          {price}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => ({
        width,
        borderRadius: tokens.radii.xl,
        backgroundColor: tokens.colors.surface.solid,
        borderWidth: 1,
        borderColor: tokens.colors.border.subtle,
        padding: tokens.spacing[3],
        gap: tokens.spacing[3],
        opacity: pressed ? 0.92 : 1,
        ...tokens.shadow.sm,
      })}
    >
      <View
        style={{
          height: width * 0.95,
          borderRadius: tokens.radii.lg,
          backgroundColor: tokens.colors.background.sunken,
          overflow: 'hidden',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }}
      >
        {image ? (
          <Image source={image} style={{ width: '100%', height: '100%', position: 'absolute' }} />
        ) : null}
        {badge ? (
          <View style={{ padding: tokens.spacing[2] }}>
            <Badge label={badge.label} tone={badge.tone ?? 'accent'} />
          </View>
        ) : null}
      </View>
      <View style={{ gap: 2 }}>
        {brand ? (
          <Text variant="caption" tone="tertiary" weight="medium">
            {brand.toUpperCase()}
          </Text>
        ) : null}
        <Text variant="bodySm" weight="semibold" numberOfLines={2}>
          {name}
        </Text>
        <Text variant="label" tone="accent" weight="semibold" style={{ marginTop: 4 }}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
}
