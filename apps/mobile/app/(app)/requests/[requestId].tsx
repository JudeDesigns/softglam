import { useMemo } from 'react';
import { Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import { Avatar, IconButton, Row, Screen, Stack } from '@softglow/ui';

import { MakeupPreview } from '@/try-on/components';
import { findLook } from '@/try-on/looks';
import { useArtists } from '@/state/artists';
import { useLookRequests, type LookRequestStatus } from '@/state/look-requests';

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

const PREVIEW_INTENSITIES = { lip: 0.85, cheek: 0.65, eye: 0.7, brow: 0.45 };

/**
 * Client-side view of a request the user sent. Shows the artist's reply when
 * the request is quoted/declined; otherwise shows where the request sits in
 * the timeline (sent → seen → reply).
 */
export default function ClientRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const request = useLookRequests((s) => s.requests.find((r) => r.id === requestId));
  const look = useMemo(() => (request ? findLook(request.lookId) : undefined), [request]);
  const findById = useArtists((s) => s.findById);
  const artist = request ? findById(request.artistId) : undefined;
  const insets = useSafeAreaInsets();

  if (!request) {
    return (
      <Screen style={{ backgroundColor: V.bg }}>
        <RNText
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 18,
            color: V.textPrimary,
          }}
        >
          Request not found
        </RNText>
        <View style={{ marginTop: tokens.spacing[4] }}>
          <VanityButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: tokens.spacing[6],
          paddingBottom: tokens.spacing[6] + 100 + insets.bottom,
        }}
      >
        {/* ── Nav header ─────────────────────────────────────────────────── */}
        <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
          <IconButton
            icon={<Ionicons name="chevron-back" size={20} color={V.textPrimary} />}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
          <Stack gap={6} align="center">
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 0.6,
                color: V.muted,
              }}
            >
              YOUR REQUEST
            </RNText>
            <RNText
              numberOfLines={1}
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 16,
                color: V.textPrimary,
              }}
            >
              {request.lookName}
            </RNText>
          </Stack>
          <View style={{ width: 40 }} />
        </Row>

        {/* ── Artist card ─────────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: V.card,
            borderWidth: 1,
            borderColor: V.cardBorder,
            borderRadius: tokens.radii.xl,
            padding: tokens.spacing[5],
          }}
        >
          <Row align="center" gap={tokens.spacing[4]}>
            <Avatar name={artist?.name ?? 'Artist'} size="lg" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <RNText
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: V.muted,
                }}
              >
                SENT TO
              </RNText>
              <RNText
                numberOfLines={1}
                style={{
                  fontFamily: 'PlayfairDisplay_400Regular',
                  fontSize: 20,
                  color: V.textPrimary,
                  marginTop: 2,
                }}
              >
                {artist?.name ?? 'Artist'}
              </RNText>
              {artist ? (
                <RNText
                  numberOfLines={1}
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    color: V.muted,
                    marginTop: 2,
                  }}
                >
                  {artist.specialty} · {artist.city}
                </RNText>
              ) : null}
            </View>
          </Row>
        </View>

        {/* ── Look preview ─────────────────────────────────────────────────── */}
        {look ? (
          <View
            style={{
              marginTop: tokens.spacing[5],
              backgroundColor: '#2B211D',
              borderRadius: tokens.radii.xl,
              padding: tokens.spacing[5],
            }}
          >
            <Stack align="center" gap={tokens.spacing[3]}>
              <Row gap={tokens.spacing[2]} align="center">
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: V.champagne + 'AA',
                  }}
                >
                  <RNText
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 11,
                      letterSpacing: 0.3,
                      color: '#7A5A2A',
                    }}
                  >
                    Look you sent
                  </RNText>
                </View>
                <RNText
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 11,
                    letterSpacing: 0.6,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {look.finish.toUpperCase()}
                </RNText>
              </Row>
              <MakeupPreview width={200} look={look} intensities={PREVIEW_INTENSITIES} />
              <RNText
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.8)',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {request.lookCaption}
              </RNText>
            </Stack>
          </View>
        ) : null}

        {/* ── Timeline ────────────────────────────────────────────────────── */}
        <View style={{ marginTop: tokens.spacing[6] }}>
          <RNText
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 10,
              letterSpacing: 0.6,
              color: V.muted,
              marginBottom: tokens.spacing[3],
            }}
          >
            STATUS
          </RNText>
          <View
            style={{
              backgroundColor: V.card,
              borderWidth: 1,
              borderColor: V.cardBorder,
              borderRadius: tokens.radii.xl,
              padding: tokens.spacing[5],
            }}
          >
            <TimelineRow
              label="Request sent"
              caption={new Date(request.createdAt).toLocaleString()}
              done
              isLast={false}
            />
            <TimelineRow
              label="Seen by artist"
              caption={request.viewedAt ? new Date(request.viewedAt).toLocaleString() : 'Waiting'}
              done={!!request.viewedAt}
              isLast={false}
            />
            <TimelineRow
              label={request.status === 'declined' ? 'Artist declined' : 'Reply received'}
              caption={replyCaption(request.status, request.quote)}
              done={request.status === 'quoted' || request.status === 'declined'}
              isLast
              tone={request.status === 'declined' ? 'danger' : 'accent'}
            />
          </View>
        </View>

        {/* ── Your note ───────────────────────────────────────────────────── */}
        {request.message ? (
          <View style={{ marginTop: tokens.spacing[6] }}>
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 0.6,
                color: V.muted,
                marginBottom: tokens.spacing[2],
              }}
            >
              YOUR NOTE
            </RNText>
            <View
              style={{
                backgroundColor: V.card,
                borderWidth: 1,
                borderColor: V.cardBorder,
                borderRadius: tokens.radii.lg,
                padding: tokens.spacing[4],
              }}
            >
              <RNText
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 14,
                  color: V.textPrimary,
                  lineHeight: 22,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{request.message}&rdquo;
              </RNText>
            </View>
          </View>
        ) : null}

        {/* ── Artist's reply ──────────────────────────────────────────────── */}
        {request.quote ? (
          <View style={{ marginTop: tokens.spacing[6] }}>
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 0.6,
                color: V.muted,
                marginBottom: tokens.spacing[2],
              }}
            >
              ARTIST&apos;S REPLY
            </RNText>
            <View
              style={{
                backgroundColor: V.card,
                borderWidth: 1,
                borderColor: V.accent + '55',
                borderRadius: tokens.radii.lg,
                padding: tokens.spacing[4],
              }}
            >
              <RNText
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 15,
                  color: V.textPrimary,
                }}
              >
                {request.quote}
              </RNText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Primary CTA row — pinned to bottom ──────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: tokens.spacing[6],
          paddingTop: tokens.spacing[4],
          paddingBottom: insets.bottom + tokens.spacing[4],
          backgroundColor: V.bg,
          borderTopWidth: 1,
          borderTopColor: V.divider,
          gap: tokens.spacing[3],
        }}
      >
        <VanityButton
          label="Send another look"
          variant="primary"
          fullWidth
          onPress={() => router.replace('/(app)/look-share')}
        />
        <VanityButton
          label="Back to requests"
          variant="secondary"
          fullWidth
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

function replyCaption(status: LookRequestStatus, quote?: string): string {
  if (status === 'quoted' && quote) return quote;
  if (status === 'declined') return 'The artist isn\u2019t able to take this on right now.';
  return 'You\u2019ll get a notification when the artist replies.';
}

function TimelineRow({
  label,
  caption,
  done,
  isLast,
  tone = 'accent',
}: {
  label: string;
  caption: string;
  done: boolean;
  isLast: boolean;
  tone?: 'accent' | 'danger';
}) {
  const dotColor = done
    ? (tone === 'danger' ? V.danger : V.accent)
    : V.cardBorder;

  return (
    <Row align="start" gap={tokens.spacing[4]}>
      <View style={{ alignItems: 'center', width: 20 }}>
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: done ? dotColor : V.card,
            borderWidth: 2,
            borderColor: dotColor,
          }}
        />
        {!isLast ? (
          <View
            style={{
              width: 2,
              flexGrow: 1,
              minHeight: 28,
              backgroundColor: V.cardBorder,
              marginTop: 4,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : tokens.spacing[5] }}>
        <RNText
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 14,
            color: V.textPrimary,
            opacity: done ? 1 : 0.5,
          }}
        >
          {label}
        </RNText>
        <RNText
          numberOfLines={2}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 12,
            color: V.muted,
            marginTop: 2,
          }}
        >
          {caption}
        </RNText>
      </View>
    </Row>
  );
}

// ─── Local button ──────────────────────────────────────────────────────────────
function VanityButton({
  label,
  variant,
  onPress,
  fullWidth,
  disabled,
}: {
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  const bg = variant === 'primary' ? V.accent : V.sunken;
  const textColor = variant === 'primary' ? '#FFFFFF' : V.textPrimary;
  const pressedBg = variant === 'primary' ? '#B5634F' : V.cardBorder;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={{ color: 'rgba(43,33,29,0.08)' }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        backgroundColor: disabled ? V.muted : pressed ? pressedBg : bg,
        borderRadius: 999,
        paddingVertical: 13,
        paddingHorizontal: 20,
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: variant === 'secondary' ? V.cardBorder : undefined,
      })}
    >
      <RNText
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 14,
          color: textColor,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </RNText>
    </Pressable>
  );
}
