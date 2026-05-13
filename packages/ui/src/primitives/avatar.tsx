import { Image, View, type ImageSourcePropType, type ViewProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends ViewProps {
  source?: ImageSourcePropType;
  /** Used to render initials when no source is provided. */
  name?: string;
  size?: AvatarSize;
  ring?: boolean;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({ source, name, size = 'md', ring = false, style, ...rest }: AvatarProps) {
  const dim = sizeMap[size];
  const radius = dim / 2;

  return (
    <View
      {...rest}
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          backgroundColor: tokens.colors.background.sunken,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...(ring ? { borderWidth: 2, borderColor: tokens.colors.accent.primary } : null),
        },
        style,
      ]}
    >
      {source ? (
        <Image source={source} style={{ width: dim, height: dim, borderRadius: radius }} />
      ) : (
        <Text
          variant={size === 'xs' || size === 'sm' ? 'caption' : 'heading'}
          tone="secondary"
          weight="semibold"
        >
          {initialsFromName(name ?? '')}
        </Text>
      )}
    </View>
  );
}
