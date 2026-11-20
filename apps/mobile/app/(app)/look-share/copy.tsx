import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, ScrollView, View } from 'react-native';
import { Pressable } from '@softglow/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import { Button, Card, IconButton, Row, Screen, Stack, Text } from '@softglow/ui';

import { apiTransferLook, FEATURES, sourceLabel, type LookTransferValidation } from '@/api/look-transfer';
import { uploadPhoto } from '@/api/media';
import type { FeatureKey, FeatureSetting, Recipe } from '@/api/types';
import { pickPhoto, type PickedPhoto } from '@/lib/photo-picker';
import {
  ArtistRow,
  GeneratedPreview,
  NoteInput,
  PhotoTile,
  RecipeCard,
  SentConfirmation,
  StepLabel,
  V,
} from '@/look-share/components';
import { useArtists } from '@/state/artists';
import { useLookRequests } from '@/state/look-requests';
import { newCopyDraftId, useLookDrafts } from '@/state/look-drafts';
import { mediaUrl } from '@/api/client';
import { useSession } from '@/state/session';
import { IntensitySlider } from '@/try-on/components';

const MAX_INSPIRATIONS = 3;

type Settings = Record<FeatureKey, FeatureSetting>;

/** Every feature from Look A at full strength, lips a little softer. */
const DEFAULT_SETTINGS: Settings = {
  brows: { source: 0, intensity: 1 },
  eyeshadow: { source: 0, intensity: 1 },
  liner: { source: 0, intensity: 1 },
  blush: { source: 0, intensity: 1 },
  contour: { source: 0, intensity: 1 },
  lips: { source: 0, intensity: 0.6 },
};

/** Applies the master "overall strength" to each feature, rounding to whole percents. */
function effectiveRecipe(settings: Settings, master: number): Recipe {
  const out: Recipe = {};
  for (const { key } of FEATURES) {
    const s = settings[key];
    out[key] = { source: s.source, intensity: Math.round(s.intensity * master * 100) / 100 };
  }
  return out;
}

const sameRecipe = (a: Recipe, b: Recipe) => JSON.stringify(a) === JSON.stringify(b);

function chooseSource(title: string, onPick: (source: 'camera' | 'library') => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: ['Cancel', 'Take a photo', 'Choose from library'], cancelButtonIndex: 0 },
      (idx) => {
        if (idx === 1) onPick('camera');
        if (idx === 2) onPick('library');
      },
    );
  } else {
    Alert.alert(title, undefined, [
      { text: 'Camera', onPress: () => onPick('camera') },
      { text: 'Library', onPress: () => onPick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
}

interface Preview {
  generatedUrl: string;
  validation: LookTransferValidation;
  /** Exactly what produced this preview — this is what the artist receives. */
  recipe: Recipe;
  selfieUrl: string;
  referenceUrls: string[];
}

/** A photo restored from a saved draft: shown from the server, already uploaded. */
function restoredPhoto(url: string): PickedPhoto {
  return { uri: mediaUrl(url), mimeType: url.endsWith('.png') ? 'image/png' : 'image/jpeg', width: 0, height: 0 };
}

export default function CopyALook() {
  const params = useLocalSearchParams<{ draft?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const artists = useArtists((s) => s.artists);
  const fetchArtists = useArtists((s) => s.fetch);
  const artistsLoading = useArtists((s) => s.isLoading);
  const sendRequest = useLookRequests((s) => s.sendRequest);

  const [selfie, setSelfie] = useState<PickedPhoto | null>(null);
  const [inspirations, setInspirations] = useState<PickedPhoto[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [master, setMaster] = useState(1);

  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const [artistId, setArtistId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentRequestId, setSentRequestId] = useState<string | null>(null);

  // local photo uri → uploaded /media path, so "Update preview" doesn't re-upload.
  const uploads = useRef(new Map<string, string>());
  // Bumped when a background upload finishes, so the draft autosave sees it.
  const [uploadVersion, setUploadVersion] = useState(0);

  // Drafts: this session's id (a resumed draft keeps its own), autosave, resume.
  const [draftId] = useState(() => params.draft ?? newCopyDraftId());
  const saveDraft = useLookDrafts((s) => s.save);
  const removeDraft = useLookDrafts((s) => s.remove);
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !params.draft) return;
    restored.current = true;
    const d = useLookDrafts.getState().drafts.find((x) => x.id === params.draft);
    if (!d) return;
    const remember = (url: string) => {
      const photo = restoredPhoto(url);
      uploads.current.set(photo.uri, url);
      return photo;
    };
    if (d.selfieUrl) setSelfie(remember(d.selfieUrl));
    if (d.referenceUrls?.length) setInspirations(d.referenceUrls.map(remember));
    if (d.settings) setSettings(d.settings);
    if (d.master !== undefined) setMaster(d.master);
    if (d.artistId) setArtistId(d.artistId);
    if (d.message) setMessage(d.message);
    if (d.previewUrl && d.previewRecipe && d.selfieUrl && d.referenceUrls) {
      setPreview({
        generatedUrl: d.previewUrl,
        validation: {
          passed: d.previewPassed ?? true,
          identity_preserved: d.previewPassed ?? true,
          makeup_applied: d.previewPassed ?? true,
          issues: d.previewIssues ?? [],
        },
        recipe: d.previewRecipe,
        selfieUrl: d.selfieUrl,
        referenceUrls: d.referenceUrls,
      });
    }
    setUploadVersion((v) => v + 1);
  }, [params.draft]);

  useEffect(() => { void fetchArtists(); }, [fetchArtists]);
  useEffect(() => {
    if (artists.length > 0 && !artistId) setArtistId(artists[0]!.id);
  }, [artists, artistId]);

  const recipe = useMemo(() => effectiveRecipe(settings, master), [settings, master]);
  const anyFeatureOn = FEATURES.some(({ key }) => (recipe[key]?.intensity ?? 0) > 0);
  const canGenerate = !!selfie && inspirations.length > 0 && anyFeatureOn && !generating;
  const previewIsCurrent =
    !!preview &&
    !!selfie &&
    preview.selfieUrl === uploads.current.get(selfie.uri) &&
    preview.referenceUrls.length === inspirations.length &&
    preview.referenceUrls.every((u, i) => uploads.current.get(inspirations[i]!.uri) === u) &&
    sameRecipe(preview.recipe, recipe);
  const canSend = previewIsCurrent && !!artistId && !sending;

  // Autosave whatever has been uploaded so far, so "My looks" can resume it.
  useEffect(() => {
    if (sentRequestId) return;
    const selfieUrl = selfie ? uploads.current.get(selfie.uri) : undefined;
    const referenceUrls = inspirations
      .map((p) => uploads.current.get(p.uri))
      .filter((u): u is string => !!u);
    if (!selfieUrl && referenceUrls.length === 0) return;
    saveDraft({
      id: draftId,
      kind: 'copy',
      title: 'Your copied look',
      selfieUrl,
      referenceUrls,
      settings,
      master,
      previewUrl: preview?.generatedUrl,
      previewRecipe: preview?.recipe,
      previewPassed: preview?.validation.passed,
      previewIssues: preview?.validation.issues,
      artistId: artistId ?? undefined,
      message: message || undefined,
    });
  }, [selfie, inspirations, settings, master, preview, artistId, message, uploadVersion, sentRequestId, draftId, saveDraft]);

  // --- Photos ---------------------------------------------------------------

  const onPickSelfie = () =>
    chooseSource('Your photo', async (source) => {
      const picked = await pickPhoto(source);
      if (!picked) return;
      setSelfie(picked);
      void uploadInBackground(picked);
    });

  const onPickInspiration = (index: number) =>
    chooseSource(`Inspiration ${sourceLabel(index)}`, async (source) => {
      const picked = await pickPhoto(source);
      if (!picked) return;
      void uploadInBackground(picked);
      setInspirations((prev) => {
        const next = [...prev];
        next[index] = picked;
        return next.slice(0, MAX_INSPIRATIONS);
      });
    });

  const onRemoveInspiration = (index: number) => {
    setInspirations((prev) => prev.filter((_, i) => i !== index));
    // Re-point features at the photos that remain.
    setSettings((prev) => {
      const next = { ...prev };
      for (const { key } of FEATURES) {
        const src = next[key].source;
        if (src === index) next[key] = { ...next[key], source: 0 };
        else if (src > index) next[key] = { ...next[key], source: src - 1 };
      }
      return next;
    });
  };

  const setFeature = (key: FeatureKey, patch: Partial<FeatureSetting>) =>
    setSettings((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // --- Generate -------------------------------------------------------------

  // Upload as soon as a photo is picked: faster previews, and it can be saved
  // as a draft. Failures are ignored here; "Create my look" retries them.
  const uploadInBackground = async (photo: PickedPhoto) => {
    try {
      await ensureUploaded(photo);
      setUploadVersion((v) => v + 1);
    } catch {
      // retried by ensureUploaded at generation time
    }
  };

  const ensureUploaded = async (photo: PickedPhoto) => {
    const cached = uploads.current.get(photo.uri);
    if (cached) return cached;
    const url = await uploadPhoto(photo.uri, photo.mimeType);
    uploads.current.set(photo.uri, url);
    return url;
  };

  const onGenerate = async () => {
    if (!canGenerate || !selfie) return;
    setGenerating(true);
    const sentRecipe = recipe;
    try {
      const [selfieUrl, ...referenceUrls] = await Promise.all([
        ensureUploaded(selfie),
        ...inspirations.map(ensureUploaded),
      ]);
      const result = await apiTransferLook({
        selfie_url: selfieUrl!,
        reference_urls: referenceUrls,
        features: sentRecipe,
      });
      setPreview({
        generatedUrl: result.generated_url,
        validation: result.validation,
        recipe: sentRecipe,
        selfieUrl: selfieUrl!,
        referenceUrls,
      });
    } catch {
      Alert.alert("Couldn't create your look", 'Please check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  // --- Send -----------------------------------------------------------------

  const onSend = async () => {
    if (!canSend || !preview || !artistId) return;
    setSending(true);
    try {
      const count = preview.referenceUrls.length;
      const id = await sendRequest({
        clientName: user?.displayName ?? 'Client',
        clientPhotoUri: preview.selfieUrl,
        generatedUri: preview.generatedUrl,
        referenceUrls: preview.referenceUrls,
        recipe: preview.recipe,
        lookId: 'custom',
        lookName: 'Your copied look',
        lookCaption: count === 1 ? 'Copied from 1 inspiration photo' : `Mixed from ${count} inspiration photos`,
        artistId,
        message: message.trim() || undefined,
      });
      removeDraft(draftId);
      setSentRequestId(id);
    } catch {
      Alert.alert("Couldn't send your look", 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (sentRequestId) {
    return <SentConfirmation lookName="Your copied look" requestId={sentRequestId} />;
  }

  // --- Render ---------------------------------------------------------------

  const mixAndMatch = inspirations.length > 1;
  const bottomAction = !previewIsCurrent
    ? {
        label: generating ? 'Creating your look…' : preview ? 'Update preview' : 'Create my look',
        disabled: !canGenerate,
        onPress: onGenerate,
        hint: !selfie
          ? 'Add your photo first'
          : inspirations.length === 0
            ? 'Add at least one inspiration photo'
            : !anyFeatureOn
              ? 'Turn on at least one feature'
              : null,
      }
    : {
        label: sending ? 'Sending…' : artistId ? 'Send to artist' : 'Pick an artist first',
        disabled: !canSend,
        onPress: onSend,
        hint: null,
      };

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: tokens.spacing[6], paddingBottom: 120 + insets.bottom }}
      >
        <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
          <IconButton
            icon={<Ionicons name="chevron-back" size={20} color={V.textPrimary} />}
            accessibilityLabel="Back"
            onPress={() => router.back()}
          />
          <Text variant="caption" weight="medium" style={{ color: V.textSecondary, letterSpacing: 1.2 }}>
            COPY A LOOK
          </Text>
          <View style={{ width: 40 }} />
        </Row>

        <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, lineHeight: 36, color: V.textPrimary }}>
          How will this look on me?
        </Text>
        <Text variant="bodySm" style={{ color: V.textSecondary, marginTop: tokens.spacing[2] }}>
          Add a selfie and up to three makeup photos you love. Copy a whole look, or mix brows,
          eyes and lips from different photos.
        </Text>

        {/* Step 1 — selfie */}
        <View style={{ marginTop: tokens.spacing[8] }}>
          <StepLabel step={1} title="Your photo" subtitle="Face the camera in soft, even light, with no filters." />
          <PhotoTile photoUri={selfie?.uri ?? null} onPress={onPickSelfie} />
        </View>

        {/* Step 2 — inspirations */}
        <View style={{ marginTop: tokens.spacing[8] }}>
          <StepLabel
            step={2}
            title="Makeup you love"
            subtitle="Clear, front-facing photos work best. Add up to three to mix and match."
          />
          <Row gap={tokens.spacing[3]}>
            {Array.from({ length: MAX_INSPIRATIONS }, (_, i) => {
              const photo = inspirations[i];
              if (!photo && i > inspirations.length) return <View key={i} style={{ flex: 1 }} />;
              return (
                <InspirationSlot
                  key={i}
                  label={sourceLabel(i)}
                  uri={photo?.uri ?? null}
                  onPress={() => onPickInspiration(Math.min(i, inspirations.length))}
                  onRemove={photo ? () => onRemoveInspiration(i) : undefined}
                />
              );
            })}
          </Row>
        </View>

        {/* Step 3 — features */}
        <View style={{ marginTop: tokens.spacing[8] }}>
          <StepLabel
            step={3}
            title="Choose what to copy"
            subtitle={
              mixAndMatch
                ? 'Pick which photo each feature comes from, and how strong it should be.'
                : 'Set how strong each feature should be. Slide to Off to skip it.'
            }
          />
          <Card padding={tokens.spacing[5]} elevation="sm" style={{ backgroundColor: V.card, borderColor: V.cardBorder, borderWidth: 1 }}>
            <Stack gap={tokens.spacing[5]}>
              <IntensitySlider icon="options-outline" label="Overall strength" value={master} onChange={setMaster} />
              <View style={{ height: 1, backgroundColor: V.cardBorder }} />
              {FEATURES.map((f) => (
                <View key={f.key}>
                  <IntensitySlider
                    icon={f.icon}
                    label={f.label}
                    value={settings[f.key].intensity}
                    onChange={(v) => setFeature(f.key, { intensity: v })}
                  />
                  {mixAndMatch && (
                    <Row gap={tokens.spacing[2]}>
                      {inspirations.map((_, i) => (
                        <SourceChip
                          key={i}
                          label={String.fromCharCode(65 + i)}
                          selected={settings[f.key].source === i}
                          disabled={settings[f.key].intensity === 0}
                          onPress={() => setFeature(f.key, { source: i })}
                        />
                      ))}
                    </Row>
                  )}
                </View>
              ))}
            </Stack>
          </Card>
        </View>

        {/* Step 4 — preview */}
        {(generating || preview) && (
          <View style={{ marginTop: tokens.spacing[8] }}>
            <StepLabel
              step={4}
              title="Your preview"
              subtitle={
                generating
                  ? 'This usually takes 10–20 seconds.'
                  : previewIsCurrent
                    ? 'Happy with it? Send it to your artist below.'
                    : 'You changed something. Update the preview to see it.'
              }
            />
            <GeneratedPreview
              generatedUri={preview?.generatedUrl ?? null}
              loadingLabel={generating ? 'Copying the makeup onto your photo…' : null}
            />
            {!generating && preview && !preview.validation.passed && (
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
                    This preview may not fully match
                    {preview.validation.issues.length > 0 ? `: ${preview.validation.issues.join('; ')}.` : '.'} Try
                    a clearer, front-facing photo for a better result.
                  </Text>
                </Row>
              </View>
            )}
          </View>
        )}

        {/* Step 5 — recipe, artist, note */}
        {previewIsCurrent && preview && (
          <>
            <View style={{ marginTop: tokens.spacing[8] }}>
              <StepLabel step={5} title="What your artist gets" subtitle="Your preview, your inspiration photos, and this recipe." />
              <RecipeCard recipe={preview.recipe} referenceUrls={preview.referenceUrls} />
            </View>
            <View style={{ marginTop: tokens.spacing[8] }}>
              <StepLabel step={6} title="Choose your artist" subtitle="They'll see everything above, plus your note." />
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
            <View style={{ marginTop: tokens.spacing[8] }}>
              <StepLabel step={7} title="Notes to my artist" subtitle="Optional: what you love, or what you'd change." />
              <NoteInput
                value={message}
                onChange={setMessage}
                placeholder="e.g. Love the brows from A, but I'd like the lip a touch less glossy."
              />
            </View>
          </>
        )}
      </ScrollView>

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
          gap: tokens.spacing[2],
        }}
      >
        {bottomAction.hint && (
          <Text variant="caption" align="center" style={{ color: V.textSecondary }}>
            {bottomAction.hint}
          </Text>
        )}
        <Button
          label={bottomAction.label}
          variant="primary"
          fullWidth
          loading={generating || sending}
          disabled={bottomAction.disabled}
          onPress={() => void bottomAction.onPress()}
        />
      </View>
    </Screen>
  );
}

function InspirationSlot({
  label,
  uri,
  onPress,
  onRemove,
}: {
  label: string;
  uri: string | null;
  onPress: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uri ? `Change ${label}` : `Add ${label}`}
        onPress={onPress}
        style={({ pressed }) => ({
          aspectRatio: 3 / 4,
          borderRadius: tokens.radii.lg,
          borderWidth: uri ? 0 : 1.5,
          borderStyle: 'dashed',
          borderColor: V.cardBorder,
          backgroundColor: V.card,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Ionicons name="add" size={26} color={V.accent} />
        )}
      </Pressable>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(43,33,29,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={14} color="#FDFAF6" />
        </Pressable>
      )}
      <Text variant="caption" weight="semibold" align="center" style={{ color: V.textPrimary, marginTop: 6 }}>
        {label}
      </Text>
    </View>
  );
}

function SourceChip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`From Look ${label}`}
      onPress={onPress}
      disabled={disabled}
      style={{
        minWidth: 36,
        paddingHorizontal: tokens.spacing[3],
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? V.accent : V.cardBorder,
        backgroundColor: selected ? V.accent : 'transparent',
        alignItems: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text variant="caption" weight="semibold" style={{ color: selected ? '#FDFAF6' : V.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}
