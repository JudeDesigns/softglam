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
 * Artist inbox. Lists every incoming look request, most recent first.
 * Each row routes to the request detail where the artist can quote/decline.
 */
export default function ArtistInbox() {
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
          Inbox
        </RNText>
        <RNText
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: V.textMeta,
            marginTop: 4,
          }}
        >
          Look requests from clients
        </RNText>
      </View>

      <Row gap={tokens.spacing[3]} style={{ marginBottom: tokens.spacing[6] }}>
        <SummaryTile label="Awaiting" value={counts.pending} accent />
        <SummaryTile label="Viewed" value={counts.viewed} />
        <SummaryTile label="Quoted" value={counts.quoted} />
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
  const isPending = request.status === 'pending';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Request from ${request.clientName}, status ${STATUS_LABEL[request.status]}`}
      android_ripple={{ color: 'rgba(43,33,29,0.06)' }}
      onPress={() => router.push(`/(app)/inbox/${request.id}`)}
      style={({ pressed }) => ({
        borderRadius: tokens.radii.xl,
        backgroundColor: V.card,
        borderWidth: 1,
        borderColor: isPending ? V.accent + '55' : V.cardBorder,
        padding: tokens.spacing[4],
        opacity: pressed ? 0.93 : 1,
      })}
    >
      <Row align="center" gap={tokens.spacing[4]}>
        <Avatar name={request.clientName} size="md" />
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
              {request.clientName}
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
            Wants &lsquo;{request.lookName}&rsquo;
          </RNText>
          <Row align="center" gap={tokens.spacing[2]} style={{ marginTop: tokens.spacing[2] }}>
            <StatusBadge status={request.status} />
            {request.message ? (
              <RNText
                numberOfLines={1}
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: V.muted,
                  flex: 1,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{request.message}&rdquo;
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
        {STATUS_LABEL[status]}
      </RNText>
    </View>
  );
}

function badgeConfigFor(status: LookRequestStatus): { bg: string; text: string } {
  switch (status) {
    case 'pending':  return { bg: V.champagne + 'AA', text: '#7A5A2A' };
    case 'viewed':   return { bg: V.sunken,            text: V.textMeta };
    case 'quoted':   return { bg: V.sage + '33',       text: '#4A6240' };
    case 'declined': return { bg: V.danger + '22',     text: V.danger };
  }
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d`;
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
          <Ionicons name="mail-open-outline" size={24} color={V.muted} />
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
          When a client sends you a look, it will land here with their photo and a personalized preview.
        </RNText>
      </Stack>
    </View>
  );
}
