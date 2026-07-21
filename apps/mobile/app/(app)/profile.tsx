import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  MetricPill,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
} from '@softglow/ui';
import { CONCERN_LABELS, topConcerns as pickTopConcerns, type SkinType } from '@softglow/types';

import { useSession } from '@/state/session';
import { useSkinProfile } from '@/state/skin-profile';
import { BAND_COPY, bandForScore } from '@/lib/skin-health';

const TYPE_LABELS: Record<SkinType, string> = {
  oily: 'Oily',
  dry: 'Dry',
  combination: 'Combination',
  normal: 'Normal',
  sensitive: 'Sensitive',
};

const TONE_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: 'Tier 1 · Very fair',
  2: 'Tier 2 · Fair',
  3: 'Tier 3 · Medium',
  4: 'Tier 4 · Tan',
  5: 'Tier 5 · Deep',
  6: 'Tier 6 · Rich',
};

interface SettingRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption?: string;
  destructive?: boolean;
  onPress?: () => void;
}

export default function Profile() {
  const { role, user, signOut } = useSession();
  const profile = useSkinProfile((s) => s.profile);

  const displayName = user?.displayName ?? 'You';

  const top = useMemo(
    () => (profile ? pickTopConcerns(profile.concerns, 3) : []),
    [profile],
  );

  const settings: SettingRow[] = [
    { icon: 'notifications-outline', label: 'Notifications', caption: 'Routine reminders, drops' },
    { icon: 'lock-closed-outline', label: 'Privacy', caption: 'Data & permissions' },
    { icon: 'card-outline', label: 'Payment methods' },
    { icon: 'help-circle-outline', label: 'Help & support' },
  ];

  return (
    <Screen style={{ backgroundColor: '#FDFAF6' }}>
      <Row justify="between" align="center" style={{ marginBottom: 20 }}>
        <Stack gap={4}>
          <Text
            variant="caption"
            style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#9A8070', letterSpacing: 0.8 }}
          >
            ACCOUNT
          </Text>
          <Text
            style={{ fontFamily: 'PlayfairDisplay_500Medium', fontSize: 20, color: '#2B211D' }}
          >
            Profile
          </Text>
        </Stack>
      </Row>

      {/* Avatar card */}
      <View
        style={{
          backgroundColor: '#FAF6F1',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E4D9CD',
          padding: 20,
        }}
      >
        <Row gap={16} align="center">
          <View
            style={{
              borderRadius: 999,
              borderWidth: 2,
              borderColor: '#C97B6A',
              padding: 2,
            }}
          >
            <Avatar name={displayName} size="lg" />
          </View>
          <Stack gap={4} style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 22, color: '#2B211D' }}
            >
              {displayName}
            </Text>
            <Text
              style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#9A8070' }}
            >
              {role === 'artist' ? 'Beauty Artist' : 'Member'}
            </Text>
          </Stack>
          <Badge label="Gold" tone="accent" />
        </Row>
      </View>

      {profile ? (
        <View style={{ marginTop: 24 }}>
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{ fontFamily: 'PlayfairDisplay_500Medium', fontSize: 16, color: '#2B211D', marginBottom: 2 }}
            >
              Your skin profile
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9A8070' }}>
              {`Captured ${formatDate(profile.capturedAt)}`}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#FAF6F1',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E4D9CD',
              padding: 18,
            }}
          >
            <Stack gap={16}>
              <Row justify="between" align="center">
                <Stack gap={4}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: '#9A8070', letterSpacing: 0.8 }}>
                    SKIN HEALTH SCORE
                  </Text>
                  <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, color: '#2B211D' }}>
                    {profile.healthScore}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#9A8070' }}>
                    {BAND_COPY[bandForScore(profile.healthScore)].headline}
                  </Text>
                </Stack>
                <Stack gap={4} align="end">
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: '#9A8070', letterSpacing: 0.8 }}>
                    TONE
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#2B211D' }}>
                    {TONE_LABELS[profile.toneTier]}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: '#9A8070', letterSpacing: 0.8, marginTop: 4 }}>
                    TYPE
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#2B211D' }}>
                    {TYPE_LABELS[profile.type]}
                  </Text>
                </Stack>
              </Row>

              {top.length > 0 ? (
                <Stack gap={8}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: '#9A8070', letterSpacing: 0.8 }}>
                    TOP CONCERNS
                  </Text>
                  <Row gap={8} wrap>
                    {top.map((c) => (
                      <MetricPill
                        key={c.concern}
                        label={CONCERN_LABELS[c.concern]}
                        value={(c.severity / 4) * 100}
                        displayValue={`${c.severity}/4`}
                        tone={c.severity >= 3 ? 'danger' : c.severity >= 2 ? 'warning' : 'accent'}
                      />
                    ))}
                  </Row>
                </Stack>
              ) : null}
            </Stack>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 24 }}>
          <View
            style={{
              backgroundColor: '#FAF6F1',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E4D9CD',
              padding: 18,
            }}
          >
            <Stack gap={12}>
              <Text style={{ fontFamily: 'PlayfairDisplay_500Medium', fontSize: 18, color: '#2B211D' }}>
                No skin profile yet
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#9A8070' }}>
                Complete the 2-minute check-in to see your Skin Health Score.
              </Text>
              <Button
                label="Start check-in"
                variant="primary"
                onPress={() => router.push('/(onboarding)/welcome')}
              />
            </Stack>
          </View>
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <Text
          style={{ fontFamily: 'PlayfairDisplay_500Medium', fontSize: 16, color: '#2B211D', marginBottom: 10 }}
        >
          Settings
        </Text>
        <View
          style={{
            backgroundColor: '#FAF6F1',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#E4D9CD',
            overflow: 'hidden',
          }}
        >
          <Stack gap={0}>
            {settings.map((s, i) => (
              <SettingItem key={s.label} row={s} divider={i < settings.length - 1} />
            ))}
          </Stack>
        </View>
      </View>

      <View style={{ marginTop: 24, marginBottom: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => { void signOut(); }}
          android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            borderWidth: 1,
            borderColor: '#E4D9CD',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            backgroundColor: '#FAF6F1',
          })}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: '#9A8070' }}>
            Sign out
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function SettingItem({ row, divider }: { row: SettingRow; divider: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={row.onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: '#E4D9CD',
      })}
    >
      <Row align="center" gap={12}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#F3EBE0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={row.icon} size={18} color="#2B211D" />
        </View>
        <Stack gap={4} style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#2B211D' }}>
            {row.label}
          </Text>
          {row.caption ? (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9A8070' }}>
              {row.caption}
            </Text>
          ) : null}
        </Stack>
        <Ionicons name="chevron-forward" size={18} color="#BDA898" />
      </Row>
    </Pressable>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}
