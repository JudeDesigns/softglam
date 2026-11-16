import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Pressable, Row, Screen, Stack, Text } from '@softglow/ui';

import { mediaUrl } from '@/api/client';
import { LooksHeader, V } from '@/look-share/components';
import { DraftRow } from '@/look-share/drafts-ui';
import { topLooksForProfile } from '@/look-share/ranking';
import { useOpenDrafts } from '@/state/look-drafts';
import { useLookRequests } from '@/state/look-requests';
import { useLookCatalog, useLookSections } from '@/state/looks';
import { useSkinProfile } from '@/state/skin-profile';
import type { MakeupLook } from '@/try-on/looks';

/**
 * The Looks tab: two clear routes to a finished look, plus a way back into
 * anything started or sent.
 *   1. Browse the look library  → /look-share/library
 *   2. Copy a look from a photo → /look-share/copy
 *   "Mine" (header)             → /look-share/mine
 */
export default function LooksHub() {
  const profile = useSkinProfile((s) => s.profile);
  const catalog = useLookSections();
  const fetchCatalog = useLookCatalog((s) => s.fetch);
  const openDrafts = useOpenDrafts();
  const sent = useLookRequests((s) => s.requests);
  useEffect(() => { void fetchCatalog(); }, [fetchCatalog]);

  const peek = useMemo(() => topLooksForProfile(catalog, profile, 3), [catalog, profile]);
  const lookCount = catalog.reduce((n, s) => n + s.looks.length, 0);
  const awaitingReply = sent.filter((r) => r.status === 'pending' || r.status === 'viewed').length;
  const quoted = sent.filter((r) => r.status === 'quoted').length;

  return (
    <Screen style={{ backgroundColor: V.bg }}>
      <LooksHeader eyebrow="LOOKS" title="Plan your look" openDraftCount={openDrafts.length} />

      <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 26, lineHeight: 34, color: V.textPrimary }}>
        How would you like to start?
      </Text>
      <Text variant="bodySm" style={{ color: V.textSecondary, marginTop: tokens.spacing[1] }}>
        See it on your own face first, then send it to your artist.
      </Text>

      {/* Route 1: library */}
      <RouteCard
        tone="dark"
        icon="color-palette-outline"
        eyebrow={profile ? 'MATCHED TO YOUR SKIN' : 'CURATED BY ARTISTS'}
        title="Browse the look library"
        body={`Choose from ${lookCount} ready-made looks and preview any of them on your photo.`}
        cta="Browse looks"
        onPress={() => router.push('/(app)/look-share/library')}
        visual={<LookPeek looks={peek} />}
      />

      {/* Route 2: copy */}
      <RouteCard
        tone="light"
        icon="images-outline"
        eyebrow="BRING YOUR OWN INSPIRATION"
        title="Copy a look from a photo"
        body="Upload makeup you love. Copy the whole look, or mix brows, eyes and lips from up to three photos."
        cta="Start with a photo"
        onPress={() => router.push('/(app)/look-share/copy')}
        visual={<SourceChips />}
      />

      {/* Pick up where you left off */}
      {openDrafts.length > 0 && (
        <View style={{ marginTop: tokens.spacing[8] }}>
          <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[3] }}>
            <Text variant="heading" style={{ color: V.textPrimary }}>Continue where you left off</Text>
            {openDrafts.length > 2 && (
              <Pressable accessibilityRole="link" onPress={() => router.push('/(app)/look-share/mine')} hitSlop={8}>
                <Text variant="caption" weight="semibold" style={{ color: V.accent }}>See all {openDrafts.length}</Text>
              </Pressable>
            )}
          </Row>
          <Stack gap={tokens.spacing[2]}>
            {openDrafts.slice(0, 2).map((d) => (
              <DraftRow key={d.id} draft={d} compact />
            ))}
          </Stack>
        </View>
      )}

      {/* Sent looks summary */}
      {sent.length > 0 && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/(app)/look-share/mine', params: { tab: 'sent' } })}
          style={({ pressed }) => ({
            marginTop: tokens.spacing[6],
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing[3],
            paddingVertical: tokens.spacing[3],
            paddingHorizontal: tokens.spacing[4],
            borderRadius: tokens.radii.lg,
            backgroundColor: V.card,
            borderWidth: 1,
            borderColor: V.cardBorder,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Ionicons name="paper-plane-outline" size={18} color={V.textPrimary} />
          <Text variant="bodySm" style={{ flex: 1, color: V.textPrimary }}>
            {sent.length} look{sent.length === 1 ? '' : 's'} sent
            {quoted > 0 ? ` · ${quoted} quote${quoted === 1 ? '' : 's'} to review` : awaitingReply > 0 ? ` · ${awaitingReply} awaiting a reply` : ''}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={V.textSecondary} />
        </Pressable>
      )}

      <View style={{ height: tokens.spacing[16] }} />
    </Screen>
  );
}

function RouteCard({
  tone,
  icon,
  eyebrow,
  title,
  body,
  cta,
  onPress,
  visual,
}: {
  tone: 'dark' | 'light';
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
  visual: React.ReactNode;
}) {
  const dark = tone === 'dark';
  const fg = dark ? '#FDFAF6' : V.textPrimary;
  const muted = dark ? 'rgba(253,250,246,0.72)' : V.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: tokens.spacing[5],
        borderRadius: tokens.radii.xl,
        backgroundColor: dark ? V.textPrimary : V.card,
        borderWidth: dark ? 0 : 1,
        borderColor: V.cardBorder,
        padding: tokens.spacing[5],
        overflow: 'hidden',
        opacity: pressed ? 0.94 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <Row gap={tokens.spacing[2]} align="center">
        <Ionicons name={icon} size={14} color={dark ? '#E8C79A' : V.accent} />
        <Text variant="caption" weight="semibold" style={{ color: dark ? '#E8C79A' : V.accent, letterSpacing: 0.8 }}>
          {eyebrow}
        </Text>
      </Row>
      <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 22, lineHeight: 28, color: fg, marginTop: tokens.spacing[2] }}>
        {title}
      </Text>
      <Text variant="bodySm" style={{ color: muted, marginTop: tokens.spacing[1] }}>{body}</Text>
      <View style={{ marginTop: tokens.spacing[4] }}>{visual}</View>
      <Row justify="between" align="center" style={{ marginTop: tokens.spacing[4] }}>
        <Text variant="bodySm" weight="semibold" style={{ color: dark ? '#FDFAF6' : V.accent }}>{cta}</Text>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: dark ? 'rgba(253,250,246,0.14)' : 'rgba(201,123,106,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-forward" size={16} color={dark ? '#FDFAF6' : V.accent} />
        </View>
      </Row>
    </Pressable>
  );
}

/** Three small look previews for the library card: AI preview if any, else the shades. */
function LookPeek({ looks }: { looks: MakeupLook[] }) {
  return (
    <Row gap={tokens.spacing[2]}>
      {looks.map((l) => (
        <View key={l.id} style={{ flex: 1, gap: 4 }}>
          <View style={{ height: 72, borderRadius: tokens.radii.md, overflow: 'hidden', backgroundColor: '#3A2E28' }}>
            {l.previewImageUrl ? (
              <Image source={{ uri: mediaUrl(l.previewImageUrl) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, flexDirection: 'row' }}>
                {[l.shades.lip, l.shades.cheek, l.shades.eye].map((c, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
              </View>
            )}
          </View>
          <Text variant="caption" numberOfLines={1} style={{ color: 'rgba(253,250,246,0.8)' }}>{l.name}</Text>
        </View>
      ))}
    </Row>
  );
}

/** "A B C → you" illustration for the copy card. */
function SourceChips() {
  const items = [
    { label: 'A', feature: 'Brows' },
    { label: 'B', feature: 'Eyes' },
    { label: 'C', feature: 'Lips' },
  ];
  return (
    <Row gap={tokens.spacing[2]} align="center">
      {items.map((it) => (
        <View
          key={it.label}
          style={{
            flex: 1,
            height: 72,
            borderRadius: tokens.radii.md,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: V.cardBorder,
            backgroundColor: V.bg,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Text variant="heading" style={{ color: V.textPrimary }}>{it.label}</Text>
          <Text variant="caption" style={{ color: V.textSecondary }}>{it.feature}</Text>
        </View>
      ))}
      <Ionicons name="arrow-forward" size={16} color={V.textSecondary} />
      <View
        style={{
          width: 56,
          height: 72,
          borderRadius: tokens.radii.md,
          backgroundColor: 'rgba(201,123,106,0.14)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="person-outline" size={22} color={V.accent} />
        <Text variant="caption" weight="semibold" style={{ color: V.accent }}>You</Text>
      </View>
    </Row>
  );
}
