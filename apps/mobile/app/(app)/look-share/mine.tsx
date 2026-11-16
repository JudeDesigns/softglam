import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Button, Pressable, Row, Screen, Stack, Text } from '@softglow/ui';

import { mediaUrl } from '@/api/client';
import { LooksHeader, V } from '@/look-share/components';
import { DraftRow, relativeTime } from '@/look-share/drafts-ui';
import { useOpenDrafts } from '@/state/look-drafts';
import { type LookRequest, type LookRequestStatus, STATUS_LABEL, useLookRequests } from '@/state/look-requests';

type Tab = 'progress' | 'sent';

const STATUS_STYLE: Record<LookRequestStatus, { bg: string; fg: string }> = {
  pending: { bg: '#F3EBE0', fg: '#7A6050' },
  viewed: { bg: '#E8C79AAA', fg: '#7A5A2A' },
  quoted: { bg: '#C97B6A22', fg: '#A3503F' },
  accepted: { bg: '#8A9A7E55', fg: '#3A5230' },
  declined: { bg: '#A8423A22', fg: '#A8423A' },
};

/** Every look the client has started (unfinished) or sent to an artist. */
export default function MyLooks() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const drafts = useOpenDrafts();
  const requests = useLookRequests((s) => s.requests);
  const isSyncing = useLookRequests((s) => s.isSyncing);
  const refresh = useLookRequests((s) => s.fetchFromApi);
  const [tab, setTab] = useState<Tab>(
    params.tab === 'sent' || (drafts.length === 0 && requests.length > 0) ? 'sent' : 'progress',
  );

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: tokens.spacing[6], paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={() => void refresh()} />}
      >
        <LooksHeader
          eyebrow="MY LOOKS"
          title="Your looks"
          showMyLooks={false}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(app)/look-share'))}
        />

        <Row
          style={{
            padding: 4,
            borderRadius: 999,
            backgroundColor: V.card,
            borderWidth: 1,
            borderColor: V.cardBorder,
            marginBottom: tokens.spacing[5],
          }}
        >
          <Segment label="In progress" count={drafts.length} active={tab === 'progress'} onPress={() => setTab('progress')} />
          <Segment label="Sent" count={requests.length} active={tab === 'sent'} onPress={() => setTab('sent')} />
        </Row>

        {tab === 'progress' ? (
          drafts.length === 0 ? (
            <Empty
              icon="sparkles-outline"
              title="Nothing in progress"
              body="Looks you start but don't send yet are saved here, so you can finish them later."
            />
          ) : (
            <Stack gap={tokens.spacing[3]}>
              <Text variant="caption" style={{ color: V.textSecondary }}>
                Saved on this phone. Tap one to pick up where you left off.
              </Text>
              {drafts.map((d) => (
                <DraftRow key={d.id} draft={d} />
              ))}
            </Stack>
          )
        ) : requests.length === 0 ? (
          <Empty
            icon="paper-plane-outline"
            title="No looks sent yet"
            body="When you send a look to your artist, it shows up here with their reply."
          />
        ) : (
          <Stack gap={tokens.spacing[3]}>
            {requests.map((r) => (
              <SentRow key={r.id} request={r} />
            ))}
          </Stack>
        )}
      </ScrollView>
    </Screen>
  );
}

function Segment({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: active ? V.textPrimary : 'transparent',
        alignItems: 'center',
      }}
    >
      <Text variant="bodySm" weight="semibold" style={{ color: active ? '#FDFAF6' : V.textPrimary }}>
        {label}
        {count > 0 ? ` · ${count}` : ''}
      </Text>
    </Pressable>
  );
}

function SentRow({ request }: { request: LookRequest }) {
  const status = STATUS_STYLE[request.status];
  const label = request.status === 'quoted' ? 'Quote to review' : STATUS_LABEL[request.status];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${request.lookName}, ${label}`}
      onPress={() => router.push(`/(app)/requests/${request.id}`)}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: request.status === 'quoted' ? V.accent : V.cardBorder,
        backgroundColor: V.card,
        borderRadius: tokens.radii.xl,
        padding: tokens.spacing[3],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Row gap={tokens.spacing[3]} align="center">
        <Image
          source={{ uri: mediaUrl(request.generatedUri) }}
          style={{ width: 60, height: 76, borderRadius: tokens.radii.md, backgroundColor: V.sand }}
          contentFit="cover"
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="bodySm" weight="semibold" numberOfLines={1} style={{ color: V.textPrimary }}>
            {request.lookName}
          </Text>
          <Text variant="caption" numberOfLines={1} style={{ color: V.textSecondary }}>
            {request.artistName ? `To ${request.artistName} · ` : ''}
            {relativeTime(request.createdAt)}
          </Text>
          <View style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: status.bg }}>
            <Text variant="caption" weight="semibold" style={{ color: status.fg, fontSize: 11 }}>{label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={V.textSecondary} />
      </Row>
    </Pressable>
  );
}

function Empty({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <Stack gap={tokens.spacing[2]} align="center" style={{ paddingVertical: tokens.spacing[10] }}>
      <Ionicons name={icon} size={30} color={V.textSecondary} />
      <Text variant="heading" align="center" style={{ color: V.textPrimary }}>{title}</Text>
      <Text variant="bodySm" align="center" style={{ color: V.textSecondary, maxWidth: 280 }}>{body}</Text>
      <View style={{ marginTop: tokens.spacing[3] }}>
        <Button label="Start a look" variant="primary" onPress={() => router.replace('/(app)/look-share')} />
      </View>
    </Stack>
  );
}
