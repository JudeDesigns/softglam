import { Image, Pressable, View, type ImageSourcePropType, type PressableProps } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
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
  /** Fixed pixel width — use for horizontal carousels. Ignored when `fluid`. */
  width?: number;
  /** Fill the parent container (use for 2-column grid wrappers). */
  fluid?: boolean;
  variant?: 'tile' | 'row';
}

/** Monochrome tints — luxury cream / pearl / gold variants. */
const PLACEHOLDER_TINTS = [
  { glow: '#F5EBC2', base: '#FAF6E8' }, // pale gold
  { glow: '#EDE9E0', base: '#F7F5EF' }, // pearl
  { glow: '#E7E5E4', base: '#F4F3F1' }, // stone
  { glow: '#EBD58A', base: '#FBF6E5' }, // champagne
  { glow: '#DDD6CC', base: '#F0EBE3' }, // sand
  { glow: '#D4D4D4', base: '#EFEFEF' }, // silver
] as const;

/** Stable hash → tint, so each product gets a consistent placeholder. */
function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TINTS[h % PLACEHOLDER_TINTS.length]!;
}

function Placeholder({ size, seed }: { size: number; seed: string }) {
  const tint = tintFor(seed);
  const id = `g-${seed.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="38%" r="62%">
          <Stop offset="0%" stopColor={tint.glow} stopOpacity={0.95} />
          <Stop offset="100%" stopColor={tint.base} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
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
  fluid = false,
  variant = 'tile',
  ...rest
}: ProductCardProps) {
  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
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

  const innerPad = tokens.spacing[3];
  // In fluid mode the card fills its parent; image uses aspectRatio so it
  // scales without needing a numeric width. In fixed mode we keep numeric
  // height for pixel-perfect carousels.
  const imageHeight = fluid ? undefined : Math.round(width * 0.88);
  const imageSize = fluid ? 200 : width - innerPad * 2;

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      {...rest}
      style={({ pressed }) => ({
        ...(fluid ? { alignSelf: 'stretch' as const } : { width }),
        borderRadius: tokens.radii.xl,
        backgroundColor: tokens.colors.surface.solid,
        borderWidth: 1,
        borderColor: tokens.colors.border.subtle,
        padding: innerPad,
        gap: tokens.spacing[3],
        opacity: pressed ? 0.92 : 1,
        ...tokens.shadow.sm,
      })}
    >
      <View
        style={{
          ...(fluid ? { aspectRatio: 1 } : { height: imageHeight }),
          borderRadius: tokens.radii.lg,
          backgroundColor: tokens.colors.background.sunken,
          overflow: 'hidden',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }}
      >
        {image ? (
          <Image source={image} style={{ width: '100%', height: '100%', position: 'absolute' }} />
        ) : (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Placeholder size={imageSize} seed={name} />
          </View>
        )}
        {badge ? (
          <View style={{ padding: tokens.spacing[2] }}>
            <Badge label={badge.label} tone={badge.tone ?? 'accent'} />
          </View>
        ) : null}
      </View>
      {/* Reserved text block: 1-line brand + 2-line name + 1-line price.
          minHeight keeps every card the same overall height regardless of
          whether the name wraps. */}
      <View style={{ gap: 2, minHeight: 84 }}>
        <Text variant="caption" tone="tertiary" weight="medium" numberOfLines={1}>
          {brand ? brand.toUpperCase() : ' '}
        </Text>
        <Text
          variant="bodySm"
          weight="semibold"
          numberOfLines={2}
          style={{ minHeight: 36 }}
        >
          {name}
        </Text>
        <Text variant="label" tone="accent" weight="semibold" style={{ marginTop: 2 }}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
}
