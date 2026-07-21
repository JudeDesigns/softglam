import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface MirrorFrameProps {
  children: ReactNode;
  width: number;
  style?: StyleProp<ViewStyle>;
}

export function MirrorFrame({ children, width, style }: MirrorFrameProps) {
  return (
    <View style={[{ width, alignSelf: 'center' }, style]}>
      {/* Ambient glow layer — sits behind the frame */}
      <View
        style={{
          position: 'absolute',
          top: 8,
          left: -12,
          right: -12,
          bottom: -8,
          borderRadius: 9999,
          backgroundColor: 'rgba(201,123,106,0.08)',
        }}
        pointerEvents="none"
      />

      {/* The arch frame itself */}
      <View
        style={{
          width: '100%',
          borderWidth: 1.5,
          borderColor: '#E4D9CD',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 120,
          borderBottomRightRadius: 120,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          // Warm inner shadow
          shadowColor: '#C97B6A',
          shadowOpacity: 0.08,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {children}
      </View>
    </View>
  );
}
