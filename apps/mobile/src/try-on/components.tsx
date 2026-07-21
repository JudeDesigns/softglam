import { View } from 'react-native';
import type { MakeupLook } from './looks';

/**
 * Stub components — the full try-on experience requires a dev build (native modules).
 * These stubs let Metro bundle successfully in Expo Go.
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

export function LookThumb(_props: {
  look: MakeupLook;
  selected: boolean;
  onPress: () => void;
  width?: number;
  fluid?: boolean;
}) {
  return <View />;
}

export function IntensitySlider(_props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: string;
  swatch?: string;
}) {
  return <View />;
}
