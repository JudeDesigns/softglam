import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text as RNText, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import { Avatar, IconButton, Row, Screen, Stack } from '@softglow/ui';

import { MakeupPreview } from '@/try-on/components';
import { findLook } from '@/try-on/looks';
import { STATUS_LABEL, useLookRequests } from '@/state/look-requests';

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

export default function InboxRequestDetail() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const request = useLookRequests((s) => s.requests.find((r) => r.id === requestId));
  const markViewed = useLookRequests((s) => s.markViewed);
  const quote = useLookRequests((s) => s.quote);
  const decline = useLookRequests((s) => s.decline);
  const insets = useSafeAreaInsets();

  const look = useMemo(() => (request ? findLook(request.lookId) : undefined), [request]);

  const [quoteText, setQuoteText] = useState('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  useEffect(() => {
    if (request && request.status === 'pending') {
      void markViewed(request.id);
    }
  }, [request, markViewed]);

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
          <VanityButton label="Back to inbox" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const onQuote = () => {
    const value = quoteText.trim();
    if (!value) return;
    void quote(request.id, value);
    setShowQuoteForm(false);
  };

  const onDecline = () => {
    void decline(request.id);
  };

  const showActionBar = request.status !== 'declined' && request.status !== 'quoted';

  // Estimate footer height for scroll padding
  const footerHeight = showQuoteForm ? 200 : 80;

  const statusBadgeCfg = requestStatusBadge(request.status);

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: tokens.spacing[6],
          paddingBottom: showActionBar
            ? tokens.spacing[6] + footerHeight + insets.bottom
            : tokens.spacing[6],
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
              REQUEST
            </RNText>
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 16,
                color: V.textPrimary,
              }}
              numberOfLines={1}
            >
              {request.lookName}
            </RNText>
          </Stack>
          <View style={{ width: 40 }} />
        </Row>

        {/* ── Client card ─────────────────────────────────────────────────── */}
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
            <Avatar name={request.clientName} size="lg" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <RNText
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: V.muted,
                }}
              >
                FROM
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
                {request.clientName}
              </RNText>
              <Row gap={tokens.spacing[2]} align="center" style={{ marginTop: tokens.spacing[1] }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: statusBadgeCfg.bg,
                  }}
                >
                  <RNText
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 11,
                      letterSpacing: 0.3,
                      color: statusBadgeCfg.text,
                    }}
                  >
                    {STATUS_LABEL[request.status]}
                  </RNText>
                </View>
                <RNText
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    color: V.muted,
                  }}
                >
                  {new Date(request.createdAt).toLocaleString()}
                </RNText>
              </Row>
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
                    Personalized preview
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
              <MakeupPreview width={220} look={look} intensities={PREVIEW_INTENSITIES} />
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

        {/* ── Client's photo placeholder ───────────────────────────────────── */}
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
            CLIENT&apos;S PHOTO
          </RNText>
          <View
            style={{
              marginTop: tokens.spacing[2],
              aspectRatio: 1,
              borderRadius: tokens.radii.xl,
              backgroundColor: V.sunken,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: V.cardBorder,
            }}
          >
            <Stack align="center" gap={tokens.spacing[2]}>
              <Ionicons name="person-circle-outline" size={56} color={V.muted} />
              <RNText
                style={{
                  fontFamily: 'Inter_400Regular',
                  fontSize: 12,
                  color: V.muted,
                }}
              >
                Reference photo · {request.clientName}
              </RNText>
            </Stack>
          </View>
        </View>

        {/* ── Note from client ─────────────────────────────────────────────── */}
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
              NOTE FROM CLIENT
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

        {/* ── Your quote ───────────────────────────────────────────────────── */}
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
              YOUR QUOTE
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

        {!showActionBar && (
          <View style={{ marginTop: tokens.spacing[6] }}>
            <VanityButton label="Back to inbox" variant="secondary" fullWidth onPress={() => router.back()} />
          </View>
        )}
      </ScrollView>

      {/* ── Action bar — pinned to bottom ────────────────────────────────── */}
      {showActionBar && (
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
          {showQuoteForm ? (
            <Stack gap={tokens.spacing[3]}>
              <RNText
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 10,
                  letterSpacing: 0.6,
                  color: V.muted,
                }}
              >
                SEND A QUOTE
              </RNText>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: V.cardBorder,
                  borderRadius: tokens.radii.lg,
                  backgroundColor: V.sunken,
                  paddingHorizontal: tokens.spacing[4],
                  paddingVertical: tokens.spacing[3],
                }}
              >
                <TextInput
                  value={quoteText}
                  onChangeText={setQuoteText}
                  accessibilityLabel="Send a quote"
                  placeholder="e.g. $180 · 90 min · in studio"
                  placeholderTextColor={V.muted}
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 15,
                    color: V.textPrimary,
                  }}
                />
              </View>
              <Row gap={tokens.spacing[3]}>
                <View style={{ flex: 1 }}>
                  <VanityButton label="Cancel" variant="secondary" fullWidth onPress={() => setShowQuoteForm(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <VanityButton label="Send quote" variant="primary" fullWidth disabled={!quoteText.trim()} onPress={onQuote} />
                </View>
              </Row>
            </Stack>
          ) : (
            <Row gap={tokens.spacing[3]}>
              <View style={{ flex: 1 }}>
                <VanityButton label="Decline" variant="danger" fullWidth onPress={onDecline} />
              </View>
              <View style={{ flex: 2 }}>
                <VanityButton label="Send quote" variant="primary" fullWidth onPress={() => setShowQuoteForm(true)} />
              </View>
            </Row>
          )}
        </View>
      )}
    </Screen>
  );
}

// ─── Local button (avoids @softglow/ui Button styling conflicts) ──────────────
function VanityButton({
  label,
  variant,
  onPress,
  fullWidth,
  disabled,
}: {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  const bg = disabled
    ? V.muted
    : variant === 'primary'
    ? V.accent
    : variant === 'danger'
    ? V.danger + '22'
    : V.sunken;
  const textColor = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? V.danger : V.textPrimary;
  const pressedBg = variant === 'primary' ? '#B5634F' : variant === 'danger' ? V.danger + '33' : V.cardBorder;

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

function requestStatusBadge(status: string): { bg: string; text: string } {
  switch (status) {
    case 'pending':  return { bg: V.champagne + 'AA', text: '#7A5A2A' };
    case 'viewed':   return { bg: V.sunken,           text: V.textMeta };
    case 'quoted':   return { bg: V.sage + '33',      text: '#4A6240' };
    case 'declined': return { bg: V.danger + '22',    text: V.danger };
    default:         return { bg: V.sunken,           text: V.textMeta };
  }
}
