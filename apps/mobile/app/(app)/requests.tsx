import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text as RNText, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Avatar, Row, Screen, Stack } from '@softglow/ui';

import {
  STATUS_LABEL,
  useLookRequests,
  type LookRequest,
  type LookRequestStatus,
} from '@/state/look-requests';
import { useArtists } from '@/state/artists';

// ─── Vanity palette (communication screens) ──────────────────────────────────
const V = {
  bg:          '#FDFAF6',
  card:        '#FAF6F1',
  cardBorder:  '#E4D9CD',
  sunken:      '#F3EBE0',
  textPrimary: '#2B211D',
  textMeta:    '#9A8070',
  muted:       '#BDA898',
  accent:      '#C97B6A',
  champagne:   '#E8C79A',
  sage:        '#8A9A7E',
  divider:     '#E4D9CD',
  danger:      '#A8423A',
} as const;

/**
 * Client-side requests list. Mirrors the artist inbox shape but reads from the
 * outgoing side: each row shows the artist who received the look and surfaces
 * any reply (quote/declined) the artist has posted back.
 */
export default function ClientRequests() {
  const requests = useLookRequests((s) => s.requests);
  const isSyncing = useLookRequests((s) => s.isSyncing);

  const counts = useMemo(() => {
    const acc: Record<LookRequestStatus, number> = {
      pending: 0,
      viewed: 0,
      quoted: 0,
      declined: 0,
    };
    for (const r of requests) acc[r.status] += 1;
    return acc;
  }, [requests]);

  if (isSyncing) {
    return (
      <Screen style={{ backgroundColor: V.bg }}>
        <ActivityIndicator
          size="large"
          color={V.accent}
          style={{ flex: 1, alignSelf: 'center', marginTop: '50%' }}
        />
      </Screen>
    );
  }

  const ListHeader = (
    <>
      <View style={{ marginBottom: tokens.spacing[6] }}>
        <RNText
          style={{
            fontFamily: 'PlayfairDisplay_600SemiBold',
            fontSize: 28,
            color: V.textPrimary,
            lineHeight: 36,
          }}
        >
          Requests
        </RNText>
        <RNText
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: V.textMeta,
            marginTop: 4,
          }}
        >
          Looks you&apos;ve sent
        </RNText>
      </View>

      <Row gap={tokens.spacing[3]} style={{ marginBottom: tokens.spacing[6] }}>
        <SummaryTile label="Awaiting" value={counts.pending + counts.viewed} accent />
        <SummaryTile label="Replied" value={counts.quoted} />
        <SummaryTile label="Declined" value={counts.declined} />
      </Row>
    </>
  );

  return (
    <Screen style={{ backgroundColor: V.bg }}>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        scrollEnabled={false}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={{ height: tokens.spacing[3] }} />}
        renderItem={({ item }) => <RequestRow request={item} />}
        ListEmptyComponent={<EmptyState />}
      />
    </Screen>
  );
}

function SummaryTile({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: tokens.radii.lg,
        borderWidth: 1,
        borderColor: accent ? V.accent + '55' : V.cardBorder,
        backgroundColor: accent ? V.accent + '14' : V.card,
        padding: tokens.spacing[4],
        gap: 2,
      }}
    >
      <RNText
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.6,
          color: accent ? V.accent : V.muted,
        }}
      >
        {label.toUpperCase()}
      </RNText>
      <RNText
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 22,
          color: V.textPrimary,
          lineHeight: 28,
        }}
      >
        {value}
      </RNText>
    </View>
  );
}

function RequestRow({ request }: { request: LookRequest }) {
  const artist = useArtists((s) => s.findById(request.artistId));
  const hasReply = request.status === 'quoted' || request.status === 'declined';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Request to ${artist?.name ?? 'Artist'}, status ${clientLabelFor(request.status)}`}
      android_ripple={{ color: 'rgba(43,33,29,0.06)' }}
      onPress={() => router.push(`/(app)/requests/${request.id}`)}
      style={({ pressed }) => ({
        borderRadius: tokens.radii.xl,
        backgroundColor: V.card,
        borderWidth: 1,
        borderColor: hasReply ? V.accent + '55' : V.cardBorder,
        padding: tokens.spacing[4],
        opacity: pressed ? 0.93 : 1,
      })}
    >
      <Row align="center" gap={tokens.spacing[4]}>
        <Avatar name={artist?.name ?? 'Artist'} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Row justify="between" align="center" gap={tokens.spacing[2]}>
            <RNText
              numberOfLines={1}
              style={{
                fontFamily: 'PlayfairDisplay_400Regular',
                fontSize: 16,
                color: V.textPrimary,
                flex: 1,
              }}
            >
              {artist?.name ?? 'Artist'}
            </RNText>
            <RNText
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: V.muted,
              }}
            >
              {formatRelative(request.createdAt)}
            </RNText>
          </Row>
          <RNText
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              color: V.textMeta,
              marginTop: 2,
            }}
          >
            Sent &lsquo;{request.lookName}&rsquo;
          </RNText>
          <Row align="center" gap={tokens.spacing[2]} style={{ marginTop: tokens.spacing[2] }}>
            <StatusBadge status={request.status} />
            {request.quote ? (
              <RNText
                numberOfLines={1}
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                  color: V.accent,
                  flex: 1,
                }}
              >
                {request.quote}
              </RNText>
            ) : null}
          </Row>
        </View>
        <Ionicons name="chevron-forward" size={18} color={V.muted} />
      </Row>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: LookRequestStatus }) {
  const config = badgeConfigFor(status);
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: config.bg,
      }}
    >
      <RNText
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          letterSpacing: 0.3,
          color: config.text,
        }}
      >
        {clientLabelFor(status)}
      </RNText>
    </View>
  );
}

function clientLabelFor(status: LookRequestStatus): string {
  if (status === 'pending') return 'Sent';
  if (status === 'viewed') return 'Seen by artist';
  if (status === 'quoted') return 'Reply received';
  return STATUS_LABEL[status];
}

function badgeConfigFor(status: LookRequestStatus): { bg: string; text: string } {
  switch (status) {
    case 'pending':  return { bg: V.sunken,            text: V.textMeta };
    case 'viewed':   return { bg: V.champagne + 'AA',  text: '#7A5A2A' };
    case 'quoted':   return { bg: V.sage + '33',       text: '#4A6240' };
    case 'declined': return { bg: V.danger + '22',     text: V.danger };
  }
}

function formatRelative(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.round(diffH / 24)}d`;
}

function EmptyState() {
  return (
    <View
      style={{
        backgroundColor: V.card,
        borderWidth: 1,
        borderColor: V.cardBorder,
        borderRadius: tokens.radii.xl,
        padding: tokens.spacing[6],
      }}
    >
      <Stack align="center" gap={tokens.spacing[3]}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: V.sunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="paper-plane-outline" size={24} color={V.muted} />
        </View>
        <RNText
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 16,
            color: V.textPrimary,
            textAlign: 'center',
          }}
        >
          No requests yet
        </RNText>
        <RNText
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: V.textMeta,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          Pick a look you love and send it to an artist. Their reply will show up right here.
        </RNText>
      </Stack>
    </View>
  );
}
