import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
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
  const { role, signOut } = useSession();
  const profile = useSkinProfile((s) => s.profile);

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
    <Screen>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <Stack gap={2}>
          <Text variant="caption" tone="tertiary" weight="medium">ACCOUNT</Text>
          <Text variant="titleSm">Profile</Text>
        </Stack>
      </Row>

      <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
        <Row gap={tokens.spacing[4]} align="center">
          <Avatar name="Sara" size="lg" />
          <Stack gap={2} style={{ flex: 1 }}>
            <Text variant="heading" tone="onHero">Sara Akello</Text>
            <Text variant="bodySm" tone="onHero" style={{ opacity: 0.75 }}>
              {role === 'artist' ? 'Beauty Artist' : 'Member · since 2025'}
            </Text>
          </Stack>
          <Badge label="Gold" tone="accent" />
        </Row>
      </Card>

      {profile ? (
        <View style={{ marginTop: tokens.spacing[6] }}>
          <SectionHeader title="Your skin profile" caption={`Captured ${formatDate(profile.capturedAt)}`} />
          <Card padding={tokens.spacing[5]} elevation="sm">
            <Stack gap={tokens.spacing[4]}>
              <Row justify="between" align="center">
                <Stack gap={2}>
                  <Text variant="label" tone="tertiary">SKIN HEALTH SCORE</Text>
                  <Text variant="title">{profile.healthScore}</Text>
                  <Text variant="bodySm" tone="secondary">{BAND_COPY[bandForScore(profile.healthScore)].headline}</Text>
                </Stack>
                <Stack gap={2} align="end">
                  <Text variant="caption" tone="tertiary">TONE</Text>
                  <Text variant="bodySm" weight="semibold">{TONE_LABELS[profile.toneTier]}</Text>
                  <Text variant="caption" tone="tertiary" style={{ marginTop: tokens.spacing[1] }}>TYPE</Text>
                  <Text variant="bodySm" weight="semibold">{TYPE_LABELS[profile.type]}</Text>
                </Stack>
              </Row>

              {top.length > 0 ? (
                <Stack gap={tokens.spacing[2]}>
                  <Text variant="label" tone="tertiary">TOP CONCERNS</Text>
                  <Row gap={tokens.spacing[2]} wrap>
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
          </Card>
        </View>
      ) : (
        <View style={{ marginTop: tokens.spacing[6] }}>
          <Card padding={tokens.spacing[5]} elevation="sm">
            <Stack gap={tokens.spacing[3]}>
              <Text variant="heading">No skin profile yet</Text>
              <Text variant="bodySm" tone="secondary">
                Complete the 2-minute assessment to get your Skin Health Score.
              </Text>
              <Button label="Take assessment" variant="primary" />
            </Stack>
          </Card>
        </View>
      )}

      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader title="Settings" />
        <Card padding={tokens.spacing[2]} elevation="sm">
          <Stack gap={0}>
            {settings.map((s, i) => (
              <SettingItem key={s.label} row={s} divider={i < settings.length - 1} />
            ))}
          </Stack>
        </Card>
      </View>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Button label="Sign out" variant="secondary" fullWidth onPress={signOut} />
      </View>
    </Screen>
  );
}

function SettingItem({ row, divider }: { row: SettingRow; divider: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={row.onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        paddingVertical: tokens.spacing[3],
        paddingHorizontal: tokens.spacing[3],
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: tokens.colors.border.subtle,
      })}
    >
      <Row align="center" gap={tokens.spacing[3]}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: tokens.colors.background.sunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={row.icon} size={18} color={tokens.colors.text.primary} />
        </View>
        <Stack gap={2} style={{ flex: 1 }}>
          <Text variant="bodySm" weight="semibold">{row.label}</Text>
          {row.caption ? (
            <Text variant="caption" tone="tertiary">{row.caption}</Text>
          ) : null}
        </Stack>
        <Ionicons name="chevron-forward" size={18} color={tokens.colors.text.tertiary} />
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
