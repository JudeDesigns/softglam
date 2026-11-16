import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Row, Text } from '@softglow/ui';
import { mediaUrl } from '@/api/client';
import type { MakeupLook } from './looks';

/**
 * MakeupPreview is a stub — the drawn try-on face requires a dev build
 * (native modules); it lets Metro bundle in Expo Go.
 * IntensitySlider is real (@react-native-community/slider ships in Expo Go).
 */

export interface Intensities {
  lip?: number;
  cheek?: number;
  eye?: number;
  brow?: number;
}

export function MakeupPreview(_props: {
  width: number;
  height?: number;
  look: MakeupLook;
  intensity?: number;
  intensities?: Intensities;
}) {
  return <View />;
}

/**
 * Catalog card: the admin's AI preview when there is one, otherwise the look's
 * three shades as swatches over its finish. `fluid` fills the parent's width.
 */
export function LookThumb({
  look,
  selected,
  onPress,
  width = 168,
  fluid,
}: {
  look: MakeupLook;
  selected: boolean;
  onPress: () => void;
  width?: number;
  fluid?: boolean;
}) {
  const shades = [look.shades.lip, look.shades.cheek, look.shades.eye];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${look.name}, ${look.finish} finish`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: fluid ? '100%' : width,
        borderRadius: tokens.radii.xl,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#C97B6A' : '#E4D9CD',
        backgroundColor: '#FAF6F1',
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ aspectRatio: 4 / 5, backgroundColor: '#2B211D' }}>
        {look.previewImageUrl ? (
          <Image
            source={{ uri: mediaUrl(look.previewImageUrl) }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {shades.map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: 'rgba(43,33,29,0.55)',
          }}
        >
          <Text variant="caption" weight="semibold" style={{ color: '#FDFAF6', fontSize: 10, letterSpacing: 0.6 }}>
            {look.finish.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={{ padding: tokens.spacing[3], gap: 2 }}>
        <Text variant="bodySm" weight="semibold" numberOfLines={1} style={{ color: '#2B211D' }}>
          {look.name}
        </Text>
        <Text variant="caption" numberOfLines={2} style={{ color: '#9A8070' }}>
          {look.caption}
        </Text>
      </View>
    </Pressable>
  );
}

/** 0–1 strength slider with a label and percentage readout; 0 reads as "Off". */
export function IntensitySlider({
  label,
  value,
  onChange,
  icon,
  swatch,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: string;
  swatch?: string;
  disabled?: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      <Row justify="between" align="center">
        <Row gap={tokens.spacing[2]} align="center">
          {swatch ? (
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: swatch }} />
          ) : icon ? (
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color="#9A8070" />
          ) : null}
          <Text variant="bodySm" weight="medium" style={{ color: '#2B211D' }}>
            {label}
          </Text>
        </Row>
        <Text variant="caption" weight="semibold" style={{ color: pct === 0 ? '#9A8070' : '#C97B6A' }}>
          {pct === 0 ? 'Off' : `${pct}%`}
        </Text>
      </Row>
      <Slider
        accessibilityLabel={`${label} strength`}
        value={value}
        onValueChange={onChange}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
        disabled={disabled}
        minimumTrackTintColor="#C97B6A"
        maximumTrackTintColor="#E4D9CD"
        thumbTintColor="#C97B6A"
        style={{ height: 36 }}
      />
    </View>
  );
}
