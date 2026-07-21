import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';

interface ScreenProps extends Omit<ScrollViewProps, 'children'> {
  children: ReactNode;
  scroll?: boolean;
  background?: 'base' | 'raised' | 'sunken' | 'inverse';
  padding?: number;
  edges?: ReadonlyArray<Edge>;
  contentStyle?: ViewStyle;
}

const bgMap = {
  base: tokens.colors.background.base,
  raised: tokens.colors.background.raised,
  sunken: tokens.colors.background.sunken,
  inverse: tokens.colors.background.inverse,
} as const;

export function Screen({
  children,
  scroll = true,
  background = 'base',
  padding = tokens.spacing[6],
  edges = ['top', 'left', 'right'],
  contentStyle,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: bgMap[background],
  };

  const innerStyle: ViewStyle = {
    padding,
    ...contentStyle,
  };

  if (!scroll) {
    // flex: 1 so descendants that rely on flex (e.g. a quiz frame pushing its
    // footer button to the bottom) actually get a flex parent to grow into.
    return (
      <SafeAreaView edges={edges} style={containerStyle}>
        <View style={[{ flex: 1 }, innerStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={containerStyle}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...rest}
        contentContainerStyle={[innerStyle, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
