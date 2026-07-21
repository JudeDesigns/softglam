import { useState } from 'react';
import { Pressable, Text as RNText, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Avatar, Row, Screen, Stack } from '@softglow/ui';

import {
  CHANNEL_LABEL,
  useInvites,
  type Invite,
  type InviteChannel,
} from '@/state/invites';

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
 * Artist-only "Invite a client" screen. Captures name + contact + channel,
 * pretends to send the invite, and lists recent invites below the form.
 */
export default function InviteClient() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [channel, setChannel] = useState<InviteChannel>('email');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const send = useInvites((s) => s.send);
  const invites = useInvites((s) => s.invites);

  const canSend = name.trim().length > 0 && (channel === 'link' || contact.trim().length > 0);

  const onSend = async () => {
    if (!canSend) return;
    const clientName = name.trim();
    setSendError(null);
    try {
      await send({
        clientName,
        contact: channel === 'link' ? '' : contact.trim(),
        channel,
        message: message.trim() || undefined,
      });
      setConfirmation(clientName);
      setName('');
      setContact('');
      setMessage('');
      setTimeout(() => setConfirmation(null), 3500);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send invite. Please try again.');
    }
  };

  return (
    <Screen style={{ backgroundColor: V.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={{ marginBottom: tokens.spacing[6] }}>
        <RNText
          style={{
            fontFamily: 'PlayfairDisplay_600SemiBold',
            fontSize: 28,
            color: V.textPrimary,
            lineHeight: 36,
          }}
        >
          Invite a friend
        </RNText>
        <RNText
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 13,
            color: V.textMeta,
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          They&apos;ll get a personalized link to download the app and start sending you looks.
        </RNText>
      </View>

      {/* ── Confirmation banner ─────────────────────────────────────────── */}
      {confirmation ? (
        <View
          style={{
            marginBottom: tokens.spacing[5],
            backgroundColor: V.accent + '18',
            borderColor: V.accent + '55',
            borderWidth: 1,
            borderRadius: tokens.radii.lg,
            padding: tokens.spacing[4],
          }}
        >
          <Row align="center" gap={tokens.spacing[3]}>
            <Ionicons name="checkmark-circle" size={20} color={V.accent} />
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 13,
                color: V.accent,
                flex: 1,
              }}
            >
              Invite sent to {confirmation}
            </RNText>
          </Row>
        </View>
      ) : null}

      {/* ── Form card ──────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: V.card,
          borderWidth: 1,
          borderColor: V.cardBorder,
          borderRadius: tokens.radii.xl,
          padding: tokens.spacing[5],
        }}
      >
        <Stack gap={tokens.spacing[4]}>
          <Field label="Client name" value={name} onChange={setName} placeholder="e.g. Priya Sharma" />

          <View>
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 0.6,
                color: V.muted,
                marginBottom: tokens.spacing[2],
              }}
            >
              SEND VIA
            </RNText>
            <Row gap={tokens.spacing[2]}>
              {(['email', 'sms', 'link'] as const).map((c) => (
                <ChannelChip key={c} channel={c} active={channel === c} onPress={() => setChannel(c)} />
              ))}
            </Row>
          </View>

          {channel !== 'link' ? (
            <Field
              label={channel === 'email' ? 'Email' : 'Phone'}
              value={contact}
              onChange={setContact}
              placeholder={channel === 'email' ? 'priya@example.com' : '+1 555 0123'}
              keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
            />
          ) : (
            <RNText
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: V.muted,
                lineHeight: 18,
              }}
            >
              We&apos;ll generate a one-time invite link you can share anywhere.
            </RNText>
          )}

          <Field
            label="Personal note (optional)"
            value={message}
            onChange={setMessage}
            placeholder="Looking forward to working with you."
            multiline
          />

          {/* Send CTA */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send invite"
            accessibilityState={{ disabled: !canSend }}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            disabled={!canSend}
            onPress={() => { void onSend(); }}
            style={({ pressed }) => ({
              backgroundColor: canSend ? (pressed ? '#B5634F' : V.accent) : V.muted,
              borderRadius: tokens.radii.pill ?? 999,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed && canSend ? 0.92 : 1,
            })}
          >
            <RNText
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 15,
                color: '#FFFFFF',
                letterSpacing: 0.2,
              }}
            >
              Send invite
            </RNText>
          </Pressable>

          {sendError ? (
            <RNText
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                color: V.danger,
                textAlign: 'center',
              }}
            >
              {sendError}
            </RNText>
          ) : null}
        </Stack>
      </View>

      {/* ── Recent invites ──────────────────────────────────────────────── */}
      {invites.length > 0 ? (
        <View style={{ marginTop: tokens.spacing[8] }}>
          <RNText
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 10,
              letterSpacing: 0.6,
              color: V.muted,
              marginBottom: tokens.spacing[3],
            }}
          >
            RECENT INVITES
          </RNText>
          <Stack gap={tokens.spacing[3]}>
            {invites.slice(0, 8).map((inv) => (
              <InviteRow key={inv.id} invite={inv} />
            ))}
          </Stack>
        </View>
      ) : null}
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View>
      <RNText
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.6,
          color: V.muted,
          marginBottom: tokens.spacing[2],
        }}
      >
        {label.toUpperCase()}
      </RNText>
      <View
        style={{
          borderWidth: 1,
          borderColor: V.cardBorder,
          borderRadius: tokens.radii.lg,
          backgroundColor: V.sunken,
          paddingHorizontal: tokens.spacing[4],
          paddingVertical: tokens.spacing[3],
          minHeight: multiline ? 80 : undefined,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={V.muted}
          multiline={multiline}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          keyboardType={keyboardType}
          accessibilityLabel={label}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            lineHeight: 22,
            color: V.textPrimary,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 64 : undefined,
          }}
        />
      </View>
    </View>
  );
}

function ChannelChip({
  channel,
  active,
  onPress,
}: {
  channel: InviteChannel;
  active: boolean;
  onPress: () => void;
}) {
  const icon: Record<InviteChannel, keyof typeof Ionicons.glyphMap> = {
    email: 'mail-outline',
    sms: 'chatbubble-outline',
    link: 'link-outline',
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      android_ripple={{ color: 'rgba(43,33,29,0.08)' }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacing[2],
        paddingVertical: tokens.spacing[3],
        borderRadius: tokens.radii.lg,
        borderWidth: 1,
        borderColor: active ? V.accent : V.cardBorder,
        backgroundColor: active ? V.accent + '18' : V.card,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Ionicons
        name={icon[channel]}
        size={16}
        color={active ? V.accent : V.textMeta}
      />
      <RNText
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
          color: active ? V.accent : V.textMeta,
          letterSpacing: 0.2,
        }}
      >
        {CHANNEL_LABEL[channel]}
      </RNText>
    </Pressable>
  );
}

function InviteRow({ invite }: { invite: Invite }) {
  const badgeCfg = inviteBadgeConfig(invite.status);
  return (
    <View
      style={{
        backgroundColor: V.card,
        borderWidth: 1,
        borderColor: V.cardBorder,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing[4],
      }}
    >
      <Row align="center" gap={tokens.spacing[3]}>
        <Avatar name={invite.clientName} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <RNText
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 14,
              color: V.textPrimary,
            }}
          >
            {invite.clientName}
          </RNText>
          <RNText
            numberOfLines={1}
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: V.muted,
              marginTop: 2,
            }}
          >
            {CHANNEL_LABEL[invite.channel]}{invite.contact ? ` · ${invite.contact}` : ''}
          </RNText>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: badgeCfg.bg,
          }}
        >
          <RNText
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 11,
              letterSpacing: 0.3,
              color: badgeCfg.text,
            }}
          >
            {badgeCfg.label}
          </RNText>
        </View>
      </Row>
    </View>
  );
}

function inviteBadgeConfig(status: Invite['status']): { label: string; bg: string; text: string } {
  switch (status) {
    case 'accepted': return { label: 'Joined',   bg: '#8A9A7E33', text: '#4A6240' };
    case 'expired':  return { label: 'Expired',  bg: '#A8423A22', text: '#A8423A' };
    default:         return { label: 'Sent',     bg: '#F3EBE0',   text: '#9A8070' };
  }
}
