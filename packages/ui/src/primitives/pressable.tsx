import { useCallback, useState, type ComponentProps } from 'react';
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type PressableStateCallbackType,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';

type RNPressableProps = ComponentProps<typeof RNPressable>;

export type PressableProps = Omit<RNPressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

/**
 * Drop-in replacement for React Native's `Pressable` that resolves a
 * function-style `style={({ pressed }) => …}` itself and passes a plain style
 * down.
 *
 * Why: with NativeWind's JSX transform and the React Compiler enabled, a
 * function passed as `style` to RN's Pressable is dropped on iOS. Every style
 * in it silently disappears: widths, backgrounds, borders (e.g. a look card
 * stretching across the screen, "Add to bag" losing its background). Always
 * import Pressable from '@softglow/ui', not 'react-native'.
 */
export function Pressable({ style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(e);
    },
    [onPressIn],
  );
  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(e);
    },
    [onPressOut],
  );

  const resolved = typeof style === 'function' ? style({ pressed, hovered: false } as PressableStateCallbackType) : style;

  return (
    <RNPressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={resolved}
    />
  );
}

export type PressableRef = View;
