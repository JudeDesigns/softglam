import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Button, Card, IconButton, Row, Screen, Stack, Text } from '@softglow/ui';

import { apiAcceptInvite } from '@/api/invites';
import { ApiError } from '@/api/client';
import { V } from '@/look-share/components';
import { useArtists } from '@/state/artists';
import { useSession } from '@/state/session';

/**
 * Redeems an artist's invite. Opened from the invite link (softglow://join/CODE,
 * code pre-filled) or from Me → "Have an invite code?".
 */
export default function JoinWithCode() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { role } = useSession();
  const findArtist = useArtists((s) => s.findById);
  const fetchArtists = useArtists((s) => s.fetch);

  const [code, setCode] = useState((params.code ?? '').trim());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedArtistId, setJoinedArtistId] = useState<string | null>(null);
  const autoTried = useRef(false);

  const redeem = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const invite = await apiAcceptInvite({ code: trimmed });
      await fetchArtists();
      setJoinedArtistId(invite.artist_id);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "That code isn't valid or has already been used. Check it with your artist."
          : err instanceof ApiError && err.status === 403
            ? 'Invite codes are for client accounts.'
            : "Couldn't reach SoftGlow. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Opened from a link: redeem straight away.
  useEffect(() => {
    if (params.code && role === 'client' && !autoTried.current) {
      autoTried.current = true;
      void redeem(params.code);
    }
  }, [params.code, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const artist = joinedArtistId ? findArtist(joinedArtistId) : undefined;

  return (
    <Screen style={{ backgroundColor: V.bg }}>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[6] }}>
        <IconButton
          icon={<Ionicons name="chevron-back" size={20} color={V.textPrimary} />}
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/home'))}
        />
        <Text variant="caption" weight="medium" style={{ color: V.textSecondary, letterSpacing: 1.2 }}>
          INVITE
        </Text>
        <View style={{ width: 40 }} />
      </Row>

      {joinedArtistId ? (
        <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
          <Stack gap={tokens.spacing[3]} align="center">
            <Ionicons name="sparkles" size={32} color="#E8C79A" />
            <Text variant="title" tone="onHero" align="center">
              You&apos;re connected{artist ? ` with ${artist.name}` : ''}
            </Text>
            <Text variant="bodySm" tone="onHero" align="center" style={{ opacity: 0.86 }}>
              Try a look on your own photo and send it{artist ? ` to ${artist.name}` : ''} before your appointment.
            </Text>
            <View style={{ alignSelf: 'stretch', marginTop: tokens.spacing[2] }}>
              <Button label="Browse looks" variant="primary" fullWidth onPress={() => router.replace('/(app)/look-share')} />
            </View>
          </Stack>
        </Card>
      ) : (
        <Stack gap={tokens.spacing[4]}>
          <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, lineHeight: 36, color: V.textPrimary }}>
            Have an invite code?
          </Text>
          <Text variant="bodySm" style={{ color: V.textSecondary }}>
            Enter the code your makeup artist sent you to connect with them.
          </Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\s/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={32}
            accessibilityLabel="Invite code"
            placeholder="Invite code"
            placeholderTextColor={V.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: error ? '#A8423A' : V.cardBorder,
              borderRadius: tokens.radii.lg,
              backgroundColor: V.card,
              paddingHorizontal: tokens.spacing[4],
              paddingVertical: tokens.spacing[3],
              fontFamily: tokens.fontFamily.sansMedium,
              fontSize: 18,
              letterSpacing: 1,
              color: V.textPrimary,
            }}
          />
          {error ? (
            <Text variant="caption" style={{ color: '#A8423A' }}>{error}</Text>
          ) : null}
          <Button
            label={busy ? 'Checking…' : 'Join'}
            variant="primary"
            fullWidth
            loading={busy}
            disabled={!code.trim() || busy || role !== 'client'}
            onPress={() => void redeem(code)}
          />
          {role !== 'client' ? (
            <Text variant="caption" style={{ color: V.textSecondary }}>Invite codes are for client accounts.</Text>
          ) : null}
        </Stack>
      )}
    </Screen>
  );
}
