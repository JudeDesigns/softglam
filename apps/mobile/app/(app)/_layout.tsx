import { Pressable, Text, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { tokens } from '@softglow/tokens';
import { useSession } from '@/state/session';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabMeta { label: string; icon: IoniconName }

const TAB_META: Record<string, TabMeta> = {
  home:        { label: 'Home',     icon: 'sparkles' },
  'look-share':{ label: 'Looks',    icon: 'color-palette' },
  requests:    { label: 'Requests', icon: 'paper-plane' },
  inbox:       { label: 'Inbox',    icon: 'mail' },
  invite:      { label: 'Invite',   icon: 'person-add' },
  shop:        { label: 'Shop',     icon: 'bag-handle' },
  profile:     { label: 'Me',       icon: 'person-circle' },
};

/** Tabs shown per role, in display order. */
const TABS_BY_ROLE = {
  client: ['home', 'look-share', 'requests', 'shop', 'profile'] as const,
  artist: ['home', 'inbox', 'shop', 'invite', 'profile'] as const,
} as const;

const SIDE_MARGIN = 16;
const TOP_GAP = 12;
const BAR_HEIGHT = 72;
const BAR_RADIUS = 36;
const INNER_PAD = 6;
const ITEM_RADIUS = 26;

function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps & { role?: string }) {
  const { role } = useSession();
  const visibleTabs = TABS_BY_ROLE[role === 'artist' ? 'artist' : 'client'] as readonly string[];

  const current = state.routes[state.index]!;
  const currentOpts = descriptors[current.key]!.options;
  if ((currentOpts.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View
      style={{
        paddingTop: TOP_GAP,
        paddingBottom: bottomInset,
        paddingHorizontal: SIDE_MARGIN,
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          height: BAR_HEIGHT,
          borderRadius: BAR_RADIUS,
          padding: INNER_PAD,
          backgroundColor: '#FAF6F1',
          borderWidth: 1,
          borderColor: '#E4D9CD',
          ...tokens.shadow.floating,
        }}
      >
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          // Only render tabs that belong to this role
          if (!meta || !visibleTabs.includes(route.name)) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={meta.label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: ITEM_RADIUS,
                  backgroundColor: focused ? '#FFFFFF' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  ...(focused ? tokens.shadow.sm : null),
                }}
              >
                <Ionicons
                  name={meta.icon}
                  size={22}
                  color={focused ? '#C97B6A' : '#BDA898'}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: focused ? tokens.fontFamily.sansSemibold : tokens.fontFamily.sansMedium,
                    fontSize: 11,
                    letterSpacing: 0.1,
                    color: focused ? '#C97B6A' : '#BDA898',
                  }}
                >
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, role } = useSession();
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home"       options={{ title: 'Home' }} />
      <Tabs.Screen name="look-share" options={{ title: 'Looks',    href: role === 'artist' ? null : undefined }} />
      <Tabs.Screen name="requests"   options={{ title: 'Requests', href: role === 'artist' ? null : undefined }} />
      <Tabs.Screen name="inbox"      options={{ title: 'Inbox',    href: role === 'client' ? null : undefined }} />
      <Tabs.Screen name="invite"     options={{ title: 'Invite',   href: role === 'client' ? null : undefined }} />
      <Tabs.Screen name="shop"       options={{ title: 'Shop' }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profile' }} />
      <Tabs.Screen name="try-on"     options={{ href: null }} />
      <Tabs.Screen name="scan"       options={{ href: null }} />
      <Tabs.Screen name="look/[id]"            options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="look-share/[id]"      options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="inbox/[requestId]"    options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="requests/[requestId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
