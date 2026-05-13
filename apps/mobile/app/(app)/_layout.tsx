import { Platform, StyleSheet, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import { useSession } from '@/state/session';

type IoniconName = keyof typeof Ionicons.glyphMap;

const SIDE_MARGIN = 16;
const TOP_GAP = 12;
const CAPSULE_HEIGHT = 64;
const CAPSULE_RADIUS = 28;

/**
 * Inner capsule painted behind the tab items. Positioned with the same insets
 * (top: TOP_GAP, bottom: safeAreaBottom, left/right: SIDE_MARGIN) used as
 * paddings on the outer tabBarStyle, so the visible capsule and the item row
 * align exactly. The outer tab bar block itself remains transparent and only
 * exists to reserve vertical space in the layout — content can no longer
 * scroll behind the navigation.
 */
function Capsule({ bottomInset }: { bottomInset: number }) {
  const frame = {
    position: 'absolute' as const,
    top: TOP_GAP,
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    bottom: bottomInset,
    borderRadius: CAPSULE_RADIUS,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    ...tokens.shadow.floating,
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={frame}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.55)' }]} />
      </View>
    );
  }
  return (
    <View style={[frame, { backgroundColor: tokens.colors.surface.solid }]} />
  );
}

function TabIcon({ name, color, focused }: { name: IoniconName; color: string; focused: boolean }) {
  return (
    <View
      style={{
        minWidth: 56,
        height: 28,
        paddingHorizontal: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? tokens.colors.accent.primarySoft : 'transparent',
      }}
    >
      <Ionicons name={name} size={20} color={focused ? tokens.colors.accent.primaryPressed : color} />
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useSession();
  const insets = useSafeAreaInsets();
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const bottomInset = Math.max(insets.bottom, 12);
  // Outer block reserves vertical space: top gap + capsule + bottom safe area.
  const outerHeight = TOP_GAP + CAPSULE_HEIGHT + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.accent.primaryPressed,
        tabBarInactiveTintColor: tokens.colors.text.tertiary,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarBackground: () => <Capsule bottomInset={bottomInset} />,
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
        tabBarIconStyle: {
          alignSelf: 'center',
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarStyle: {
          // Outer layout block — non-absolute, so it reserves space and
          // content above scrolls naturally without sliding under the bar.
          height: outerHeight,
          paddingTop: TOP_GAP + 8,
          paddingBottom: bottomInset + 8,
          paddingHorizontal: SIDE_MARGIN + 8,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.fontFamily.sansMedium,
          fontSize: 10,
          letterSpacing: 0.2,
          textAlign: 'center',
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="sparkles" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="try-on"
        options={{
          title: 'Try-On',
          tabBarIcon: ({ color, focused }) => <TabIcon name="happy" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => <TabIcon name="scan-circle" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => <TabIcon name="bag-handle" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="person-circle" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
