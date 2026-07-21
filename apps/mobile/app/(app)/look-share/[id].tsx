import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  MirrorFrame,
  Row,
  Screen,
  Stack,
  Text,
} from '@softglow/ui';

import { MakeupPreview } from '@/try-on/components';
import { findLook } from '@/try-on/looks';
import { useArtists } from '@/state/artists';
import { useSession } from '@/state/session';
import type { ApiArtist } from '@/api/types';
import { useLookRequests } from '@/state/look-requests';
import { pickPhoto } from '@/lib/photo-picker';
import { generateLookOnPhoto, type GenerationStage, type LookValidation } from '@/look-share/generation';
import { useSkinProfile } from '@/state/skin-profile';

// ---------------------------------------------------------------------------
// Vanity design tokens
// ---------------------------------------------------------------------------
const V = {
  bg: '#FDFAF6',
  card: '#FAF6F1',
  cardBorder: '#E4D9CD',
  textPrimary: '#2B211D',
  textSecondary: '#9A8070',
  accent: '#C97B6A',
  plum: '#5B2A4A',
  sand: '#E4D9CD',
} as const;

type Step = 'compose' | 'sent';

const PREVIEW_INTENSITIES = { lip: 0.85, cheek: 0.65, eye: 0.7, brow: 0.45 };

export default function LookShareDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const look = useMemo(() => (id ? findLook(id) : undefined), [id]);

  const { user } = useSession();
  const toneTier = useSkinProfile((s) => s.profile?.toneTier ?? null);
  const artists = useArtists((s) => s.artists);
  const fetchArtists = useArtists((s) => s.fetch);
  const artistsLoading = useArtists((s) => s.isLoading);
  const sendRequest = useLookRequests((s) => s.sendRequest);
  const insets = useSafeAreaInsets();

  // --- State ---
  const [step, setStep] = useState<Step>('compose');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [stage, setStage] = useState<GenerationStage>('idle');

  // Result phase (after generation)
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [validation, setValidation] = useState<LookValidation | null>(null);

  const [artistId, setArtistId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sentRequestId, setSentRequestId] = useState<string | null>(null);

  useEffect(() => { void fetchArtists(); }, [fetchArtists]);

  useEffect(() => {
    if (artists.length > 0 && !artistId) setArtistId(artists[0]!.id);
  }, [artists, artistId]);

  if (!look) {
    return (
      <Screen style={{ backgroundColor: V.bg }}>
        <Text variant="heading" style={{ color: V.textPrimary }}>Look not found</Text>
        <View style={{ marginTop: tokens.spacing[4] }}>
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const isBusy = stage === 'uploading' || stage === 'generating' || stage === 'validating';
  const canSend = stage === 'ready' && !!generatedUri && !!artistId;

  // --- Handlers ---
  const handlePickPhoto = async (source: 'camera' | 'library') => {
    const picked = await pickPhoto(source);
    if (!picked) return;

    // Reset previous generation state.
    setGeneratedUri(null);
    setValidation(null);
    setStage('idle');
    setPhotoUri(picked.uri);

    // Immediately start generation.
    try {
      const result = await generateLookOnPhoto({
        photoUri: picked.uri,
        look,
        toneTier,
        onStage: setStage,
      });
      setGeneratedUri(result.generatedUri);
      setValidation(result.validation ?? null);
    } catch {
      setStage('error');
      Alert.alert('Generation failed', 'Please try again.');
    }
  };

  const onPickPhoto = () => {
    if (isBusy) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take a selfie', 'Choose from library'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) void handlePickPhoto('camera');
          if (idx === 2) void handlePickPhoto('library');
        },
      );
    } else {
      Alert.alert('Add a photo', 'Take a selfie or pick from your library', [
        { text: 'Camera', onPress: () => void handlePickPhoto('camera') },
        { text: 'Library', onPress: () => void handlePickPhoto('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const onSend = () => {
    if (!photoUri || !generatedUri || !artistId) return;
    const artist = artists.find((a) => a.id === artistId);
    if (!artist) return;
    void sendRequest({
      clientName: user?.displayName ?? 'Client',
      clientPhotoUri: photoUri,
      generatedUri,
      lookId: look.id,
      lookName: look.name,
      lookCaption: look.caption,
      artistId: artist.id,
      message: message.trim() || undefined,
    }).then((reqId) => {
      setSentRequestId(reqId);
      setStep('sent');
    });
  };

  if (step === 'sent') {
    return <SentConfirmation lookName={look.name} requestId={sentRequestId} />;
  }

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: tokens.spacing[6],
          paddingBottom: stage === 'ready'
            ? tokens.spacing[6] + 80 + insets.bottom
            : tokens.spacing[6],
        }}
      >
        {/* Header */}
        <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
          <IconButton
            icon={<Ionicons name="chevron-back" size={20} color={V.textPrimary} />}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
          <Stack gap={6} align="center">
            <Text
              variant="caption"
              weight="medium"
              style={{ color: V.textSecondary, letterSpacing: 1.2 }}
            >
              SEND A LOOK
            </Text>
            <Text
              variant="titleSm"
              numberOfLines={1}
              style={{ color: V.textPrimary }}
            >
              {look.name}
            </Text>
          </Stack>
          <View style={{ width: 40 }} />
        </Row>

        {/* Screen title */}
        <View style={{ marginBottom: tokens.spacing[6] }}>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_600SemiBold',
              fontSize: 28,
              color: V.textPrimary,
              lineHeight: 36,
            }}
          >
            Create Your Look
          </Text>
        </View>

        {/* Look preview hero */}
        <Card
          surface="hero"
          elevation="hero"
          borderless
          padding={tokens.spacing[5]}
          style={{ borderWidth: 1, borderColor: V.cardBorder }}
        >
          <Stack align="center" gap={tokens.spacing[3]}>
            <Row gap={tokens.spacing[2]} align="center">
              <Badge label="Look" tone="accent" onHero />
              <Text variant="label" tone="onHero" weight="medium">{look.finish.toUpperCase()}</Text>
            </Row>
            <MakeupPreview width={200} look={look} intensities={PREVIEW_INTENSITIES} />
            <Text variant="bodySm" tone="onHero" style={{ opacity: 0.86 }} align="center">
              {look.caption}
            </Text>
          </Stack>
        </Card>

        {/* Step 1: Photo */}
        <View style={{ marginTop: tokens.spacing[8] }}>
          <StepLabel step={1} title="Upload your photo" subtitle="We'll use it to show how this look looks on you." />
          <PhotoTile photoUri={photoUri} stage={stage} onPress={onPickPhoto} />
        </View>

        {/* Inline error UI */}
        {stage === 'error' && (
          <View style={{ marginTop: tokens.spacing[6] }}>
            <Card
              padding={tokens.spacing[5]}
              elevation="sm"
              style={{ backgroundColor: V.card, borderColor: V.cardBorder, borderWidth: 1 }}
            >
              <Stack gap={tokens.spacing[3]} align="center">
                <Ionicons name="alert-circle-outline" size={32} color={tokens.colors.state.danger} />
                <Text variant="heading" align="center" style={{ color: V.textPrimary }}>
                  Something went wrong
                </Text>
                <Text variant="bodySm" align="center" style={{ color: V.textSecondary }}>
                  We couldn't process your photo. Please try again.
                </Text>
                <Button
                  label="Retry"
                  variant="primary"
                  fullWidth
                  onPress={() => setStage('idle')}
                />
              </Stack>
            </Card>
          </View>
        )}

        {/* Step 2: Generated preview — wrapped in MirrorFrame */}
        {(stage === 'uploading' || stage === 'generating' || stage === 'validating' || stage === 'ready') && (
          <View style={{ marginTop: tokens.spacing[8] }}>
            <StepLabel
              step={2}
              title="Your personalised preview"
              subtitle={
                stage === 'ready'
                  ? "Here's how the look reads on you. Send it to your artist or try another photo."
                  : stage === 'validating'
                    ? 'Double-checking the result matches your look…'
                    : 'Applying the look to your photo…'
              }
            />
            {/* Reveal heading — Playfair italic */}
            {stage === 'ready' && (
              <Text
                style={{
                  fontFamily: 'PlayfairDisplay_500Medium',
                  fontStyle: 'italic',
                  fontSize: 20,
                  color: V.textPrimary,
                  marginBottom: tokens.spacing[4],
                }}
              >
                Your Generated Look
              </Text>
            )}
            <GeneratedPreview stage={stage} generatedUri={generatedUri} />
            {stage === 'ready' && validation && !validation.passed && (
              <View
                style={{
                  marginTop: tokens.spacing[3],
                  padding: tokens.spacing[3],
                  borderRadius: tokens.radii.md,
                  backgroundColor: '#FBF0E4',
                  borderWidth: 1,
                  borderColor: '#E8CDA6',
                }}
              >
                <Row gap={tokens.spacing[2]} align="start">
                  <Ionicons name="warning-outline" size={16} color="#9A6B1F" style={{ marginTop: 1 }} />
                  <Text variant="caption" style={{ color: '#7A5416', flex: 1 }}>
                    This preview may not fully match the look yet
                    {validation.issues.length > 0 ? `: ${validation.issues.join('; ')}` : '.'} Try a different photo for a better result.
                  </Text>
                </Row>
              </View>
            )}
            {stage === 'ready' && (
              <View style={{ marginTop: tokens.spacing[3] }}>
                <Button
                  label="Try a different photo"
                  variant="secondary"
                  fullWidth
                  onPress={onPickPhoto}
                />
              </View>
            )}
          </View>
        )}

        {/* Step 3: Artist picker */}
        {stage === 'ready' && (
          <View style={{ marginTop: tokens.spacing[8] }}>
            <StepLabel step={3} title="Choose your artist" subtitle="They'll receive your photo, the look, and your note." />
            {artistsLoading ? (
              <ActivityIndicator color={V.accent} />
            ) : (
              <Stack gap={tokens.spacing[3]}>
                {artists.map((a) => (
                  <ArtistRow key={a.id} artist={a} selected={a.id === artistId} onPress={() => setArtistId(a.id)} />
                ))}
              </Stack>
            )}
          </View>
        )}

        {/* Step 4: Note */}
        {stage === 'ready' && (
          <View style={{ marginTop: tokens.spacing[8] }}>
            <StepLabel step={4} title="Add a note" subtitle="Optional — tell your artist about the occasion or how to adapt the look." />
            <View
              style={{
                borderWidth: 1,
                borderColor: V.cardBorder,
                borderRadius: tokens.radii.lg,
                backgroundColor: V.card,
                paddingHorizontal: tokens.spacing[4],
                paddingVertical: tokens.spacing[3],
                minHeight: 96,
                marginTop: tokens.spacing[3],
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                accessibilityLabel="Add a note for your artist"
                placeholder="e.g. For my engagement shoot on Saturday — let's keep the lip softer."
                placeholderTextColor={V.textSecondary}
                style={{
                  fontFamily: tokens.fontFamily.sans,
                  fontSize: 15,
                  lineHeight: 22,
                  color: V.textPrimary,
                  textAlignVertical: 'top',
                  minHeight: 72,
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Send CTA — pinned to bottom */}
      {stage === 'ready' && (
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
            borderTopColor: V.cardBorder,
          }}
        >
          <Button
            label={canSend ? 'Send to artist' : 'Pick an artist first'}
            variant="primary"
            fullWidth
            disabled={!canSend}
            onPress={onSend}
          />
        </View>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepLabel({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: tokens.spacing[4] }}>
      <Text variant="caption" weight="medium" style={{ color: V.textSecondary, letterSpacing: 1 }}>
        STEP {step}
      </Text>
      <Text variant="heading" style={{ marginTop: 2, color: V.textPrimary }}>{title}</Text>
      <Text variant="bodySm" style={{ marginTop: 2, color: V.textSecondary }}>{subtitle}</Text>
    </View>
  );
}

function PhotoTile({
  photoUri,
  stage,
  onPress,
}: {
  photoUri: string | null;
  stage: GenerationStage;
  onPress: () => void;
}) {
  const uploading = stage === 'uploading';
  const filled = !!photoUri;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={photoUri ? 'Change photo' : 'Add a photo'}
      onPress={onPress}
      disabled={uploading}
      style={({ pressed }) => ({
        borderWidth: filled ? 0 : 1.5,
        borderStyle: 'dashed',
        borderColor: V.cardBorder,
        borderRadius: tokens.radii.xl,
        backgroundColor: filled ? V.textPrimary : V.card,
        paddingVertical: tokens.spacing[8],
        paddingHorizontal: tokens.spacing[5],
        alignItems: 'center',
        opacity: pressed ? 0.92 : 1,
        overflow: 'hidden',
      })}
    >
      {uploading ? (
        <Stack gap={tokens.spacing[2]} align="center">
          <ActivityIndicator color={V.accent} />
          <Text variant="bodySm" style={{ color: V.textSecondary }}>Uploading…</Text>
        </Stack>
      ) : filled ? (
        <Stack gap={tokens.spacing[2]} align="center">
          <Image
            source={{ uri: photoUri }}
            style={{ width: 120, height: 160, borderRadius: tokens.radii.lg }}
            contentFit="cover"
          />
          <Text variant="caption" tone="onHero" style={{ opacity: 0.7, marginTop: 4 }}>Tap to change photo</Text>
        </Stack>
      ) : (
        <Stack gap={tokens.spacing[2]} align="center">
          <Ionicons name="camera-outline" size={32} color={V.accent} />
          <Text variant="bodySm" weight="semibold" style={{ color: V.textPrimary }}>Tap to add a photo</Text>
          <Text variant="caption" style={{ color: V.textSecondary }}>Selfie or library</Text>
        </Stack>
      )}
    </Pressable>
  );
}

function GeneratedPreview({
  stage,
  generatedUri,
}: {
  stage: GenerationStage;
  generatedUri: string | null;
}) {
  if (stage === 'uploading' || stage === 'generating' || stage === 'validating') {
    return (
      <View
        style={{
          height: 260,
          borderRadius: tokens.radii.xl,
          backgroundColor: V.card,
          borderWidth: 1,
          borderColor: V.cardBorder,
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing[3],
        }}
      >
        <ActivityIndicator color={V.accent} />
        <Text variant="bodySm" style={{ color: V.textSecondary }}>
          {stage === 'validating' ? 'Checking the result…' : 'Mapping the look to your face…'}
        </Text>
      </View>
    );
  }

  if (!generatedUri) return null;

  // MirrorFrame wraps the generated result — the ONE place it appears in the app
  return (
    <MirrorFrame width={280} style={{ alignSelf: 'center' }}>
      <Image
        source={{ uri: generatedUri }}
        style={{ width: '100%', aspectRatio: 3 / 4 }}
        contentFit="cover"
      />
      <View
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
        }}
      >
        <Badge label="Personalised preview" tone="accent" />
      </View>
    </MirrorFrame>
  );
}

function ArtistRow({
  artist,
  selected,
  onPress,
}: {
  artist: ApiArtist;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={{ color: 'rgba(201,123,106,0.08)' }}
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: selected ? V.accent : V.cardBorder,
        backgroundColor: selected ? V.plum : V.card,
        borderRadius: tokens.radii.xl,
        padding: tokens.spacing[4],
        opacity: pressed ? 0.94 : 1,
      })}
    >
      <Row align="center" gap={tokens.spacing[4]}>
        <Avatar name={artist.name} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            variant="bodySm"
            weight="semibold"
            tone={selected ? 'onHero' : 'primary'}
            numberOfLines={1}
            style={{ color: selected ? '#FDFAF6' : V.textPrimary }}
          >
            {artist.name}
          </Text>
          <Text
            variant="caption"
            numberOfLines={1}
            style={{ color: selected ? 'rgba(253,250,246,0.72)' : V.textSecondary }}
          >
            {artist.specialty} · {artist.city}
          </Text>
          <Row gap={tokens.spacing[3]} align="center" style={{ marginTop: 4 }}>
            <Row gap={4} align="center">
              <Ionicons name="star" size={12} color={selected ? '#E4D9CD' : V.accent} />
              <Text
                variant="caption"
                weight="semibold"
                style={{ color: selected ? '#E4D9CD' : V.accent }}
              >
                {artist.rating.toFixed(1)}
              </Text>
            </Row>
            <Text
              variant="caption"
              style={{ color: selected ? 'rgba(253,250,246,0.72)' : V.textSecondary }}
            >
              Replies in ~{artist.response_time_hours}h
            </Text>
          </Row>
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? '#E4D9CD' : V.textSecondary}
        />
      </Row>
    </Pressable>
  );
}

function SentConfirmation({ lookName, requestId }: { lookName: string; requestId: string | null }) {
  return (
    <Screen style={{ backgroundColor: V.bg }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
          <Stack align="center" gap={tokens.spacing[4]}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(201,123,106,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="paper-plane" size={28} color={V.accent} />
            </View>
            <Badge label="Sent" tone="accent" onHero />
            <Text variant="title" tone="onHero" align="center">Your look is on its way</Text>
            <Text variant="bodySm" tone="onHero" align="center" style={{ opacity: 0.86 }}>
              {lookName} has been sent to your artist along with your personalised preview. You&apos;ll hear back soon.
            </Text>
            {requestId ? (
              <Text variant="caption" tone="onHero" style={{ opacity: 0.6 }}>Ref · {requestId}</Text>
            ) : null}
          </Stack>
        </Card>
        <View style={{ marginTop: tokens.spacing[6], gap: tokens.spacing[3] }}>
          <Button label="Browse more looks" variant="primary" fullWidth onPress={() => router.replace('/(app)/look-share')} />
          <Button label="Back to home" variant="secondary" fullWidth onPress={() => router.replace('/(app)/home')} />
        </View>
      </View>
    </Screen>
  );
}
