import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import {
  Badge,
  Button,
  Card,
  IconButton,
  Row,
  Screen,
  Stack,
  Text,
} from '@softglow/ui';

import { MakeupPreview } from '@/try-on/components';
import { useLook } from '@/state/looks';
import { useArtists } from '@/state/artists';
import { useSession } from '@/state/session';
import { useLookRequests } from '@/state/look-requests';
import { pickPhoto } from '@/lib/photo-picker';
import { generateLookOnPhoto, type GenerationStage, type LookValidation } from '@/look-share/generation';
import { useSkinProfile } from '@/state/skin-profile';
import {
  ArtistRow,
  GeneratedPreview,
  NoteInput,
  PhotoTile,
  SentConfirmation,
  StepLabel,
  V,
} from '@/look-share/components';

type Step = 'compose' | 'sent';

const PREVIEW_INTENSITIES = { lip: 0.85, cheek: 0.65, eye: 0.7, brow: 0.45 };

export default function LookShareDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const look = useLook(id);

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
  // Stored /media path of the same photo, sent to the artist.
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<GenerationStage>('idle');

  // Result phase (after generation)
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [validation, setValidation] = useState<LookValidation | null>(null);

  const [artistId, setArtistId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sentRequestId, setSentRequestId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
    setUploadedPhotoUrl(null);
    setValidation(null);
    setStage('idle');
    setPhotoUri(picked.uri);

    // Immediately start generation.
    try {
      const result = await generateLookOnPhoto({
        photoUri: picked.uri,
        photoMimeType: picked.mimeType,
        look,
        toneTier,
        onStage: setStage,
      });
      setUploadedPhotoUrl(result.uploadedPhotoUrl);
      setGeneratedUri(result.generatedUri);
      setValidation(result.validation);
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

  const onSend = async () => {
    if (!uploadedPhotoUrl || !generatedUri || !artistId || sending) return;
    const artist = artists.find((a) => a.id === artistId);
    if (!artist) return;
    setSending(true);
    try {
      const reqId = await sendRequest({
        clientName: user?.displayName ?? 'Client',
        clientPhotoUri: uploadedPhotoUrl,
        generatedUri,
        lookId: look.id,
        lookName: look.name,
        lookCaption: look.caption,
        artistId: artist.id,
        message: message.trim() || undefined,
      });
      setSentRequestId(reqId);
      setStep('sent');
    } catch {
      Alert.alert("Couldn't send your look", 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
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
          <PhotoTile photoUri={photoUri} busy={stage === 'uploading'} onPress={onPickPhoto} />
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
            <GeneratedPreview
              generatedUri={generatedUri}
              loadingLabel={
                stage === 'validating'
                  ? 'Checking the result…'
                  : stage === 'ready'
                    ? null
                    : 'Mapping the look to your face…'
              }
            />
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
            <NoteInput
              value={message}
              onChange={setMessage}
              placeholder="e.g. For my engagement shoot on Saturday — let's keep the lip softer."
            />
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
            label={sending ? 'Sending…' : canSend ? 'Send to artist' : 'Pick an artist first'}
            variant="primary"
            fullWidth
            disabled={!canSend || sending}
            onPress={() => void onSend()}
          />
        </View>
      )}
    </Screen>
  );
}
