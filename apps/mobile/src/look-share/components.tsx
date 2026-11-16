/**
 * Building blocks shared by the Look Share flows: sending a catalog look
 * (app/(app)/look-share/[id].tsx) and copying a look from photos
 * (app/(app)/look-share/copy.tsx).
 */
import { ActivityIndicator, TextInput, View } from 'react-native';
import { Pressable } from '@softglow/ui';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Avatar, Badge, Button, Card, MirrorFrame, Row, Screen, Stack, Text } from '@softglow/ui';

import { mediaUrl } from '@/api/client';
import { FEATURES, sourceLabel } from '@/api/look-transfer';
import type { ApiArtist, Recipe } from '@/api/types';
import type { LookRequest } from '@/state/look-requests';

/** Vanity design tokens used across Look Share screens. */
export const V = {
  bg: '#FDFAF6',
  card: '#FAF6F1',
  cardBorder: '#E4D9CD',
  textPrimary: '#2B211D',
  textSecondary: '#9A8070',
  accent: '#C97B6A',
  plum: '#5B2A4A',
  sand: '#E4D9CD',
} as const;

export function StepLabel({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
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

export function PhotoTile({
  photoUri,
  busy = false,
  onPress,
  emptyHint = 'Selfie or library',
}: {
  photoUri: string | null;
  busy?: boolean;
  onPress: () => void;
  emptyHint?: string;
}) {
  const uploading = busy;
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
          <Text variant="caption" style={{ color: V.textSecondary }}>{emptyHint}</Text>
        </Stack>
      )}
    </Pressable>
  );
}

export function GeneratedPreview({
  loadingLabel,
  generatedUri,
}: {
  /** When set, shows a spinner with this label instead of the image. */
  loadingLabel?: string | null;
  generatedUri: string | null;
}) {
  if (loadingLabel) {
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
          {loadingLabel}
        </Text>
      </View>
    );
  }

  if (!generatedUri) return null;

  // MirrorFrame wraps the generated result — the ONE place it appears in the app
  return (
    <MirrorFrame width={280} style={{ alignSelf: 'center' }}>
      <Image
        source={{ uri: mediaUrl(generatedUri) }}
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

export function ArtistRow({
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

export function SentConfirmation({ lookName, requestId }: { lookName: string; requestId: string | null }) {
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


/** Multiline "note to my artist" field. */
export function NoteInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
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
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={2000}
        accessibilityLabel="Add a note for your artist"
        placeholder={placeholder}
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
  );
}


/**
 * The "recipe" an artist receives with a copied look: for each feature, which
 * inspiration photo it came from and how strongly it was applied.
 */
export function RecipeCard({ recipe, referenceUrls }: { recipe: Recipe; referenceUrls: string[] }) {
  const active = FEATURES.filter((f) => (recipe[f.key]?.intensity ?? 0) > 0);
  const off = FEATURES.filter((f) => (recipe[f.key]?.intensity ?? 0) <= 0);

  return (
    <Card padding={tokens.spacing[5]} elevation="sm" style={{ backgroundColor: V.card, borderColor: V.cardBorder, borderWidth: 1 }}>
      <Stack gap={tokens.spacing[4]}>
        {referenceUrls.length > 0 && (
          <Row gap={tokens.spacing[3]}>
            {referenceUrls.map((url, i) => (
              <Stack key={url} gap={4} align="center">
                <Image
                  source={{ uri: mediaUrl(url) }}
                  style={{ width: 72, height: 96, borderRadius: tokens.radii.md, backgroundColor: V.sand }}
                  contentFit="cover"
                />
                <Text variant="caption" weight="semibold" style={{ color: V.textPrimary }}>
                  {sourceLabel(i)}
                </Text>
              </Stack>
            ))}
          </Row>
        )}
        <Stack gap={tokens.spacing[3]}>
          {active.map((f) => {
            const setting = recipe[f.key]!;
            const pct = Math.round(setting.intensity * 100);
            return (
              <Row key={f.key} justify="between" align="center">
                <Row gap={tokens.spacing[2]} align="center">
                  <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={16} color={V.textSecondary} />
                  <Text variant="bodySm" weight="medium" style={{ color: V.textPrimary }}>{f.label}</Text>
                </Row>
                <Text variant="bodySm" style={{ color: V.textSecondary }}>
                  {sourceLabel(setting.source)} ·{' '}
                  <Text variant="bodySm" weight="semibold" style={{ color: V.accent }}>{pct}%</Text>
                </Text>
              </Row>
            );
          })}
        </Stack>
        {off.length > 0 && (
          <Text variant="caption" style={{ color: V.textSecondary }}>
            Not copied: {off.map((f) => f.label.toLowerCase()).join(', ')}
          </Text>
        )}
      </Stack>
    </Card>
  );
}


function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      variant="caption"
      weight="semibold"
      style={{ color: V.textSecondary, letterSpacing: 0.6, marginBottom: tokens.spacing[2] }}
    >
      {children}
    </Text>
  );
}

/**
 * Everything visual a look request carries: the AI preview, the client's own
 * photo and, for copied looks, the inspiration photos + recipe.
 */
export function RequestVisuals({
  request,
  beforeLabel = 'Before',
}: {
  request: Pick<LookRequest, 'generatedUri' | 'clientPhotoUri' | 'recipe' | 'referenceUrls'>;
  beforeLabel?: string;
}) {
  return (
    <Stack gap={tokens.spacing[6]}>
      <View>
        <SectionLabel>AI PREVIEW</SectionLabel>
        <Row gap={tokens.spacing[3]} align="start">
          <Image
            source={{ uri: mediaUrl(request.generatedUri) }}
            style={{ flex: 2, aspectRatio: 3 / 4, borderRadius: tokens.radii.xl, backgroundColor: V.sand }}
            contentFit="cover"
            accessibilityLabel="AI preview of the look on the client"
          />
          <Stack gap={4} style={{ flex: 1 }}>
            <Image
              source={{ uri: mediaUrl(request.clientPhotoUri) }}
              style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: tokens.radii.lg, backgroundColor: V.sand }}
              contentFit="cover"
              accessibilityLabel="Original photo"
            />
            <Text variant="caption" align="center" style={{ color: V.textSecondary }}>
              {beforeLabel}
            </Text>
          </Stack>
        </Row>
      </View>
      {request.recipe ? (
        <View>
          <SectionLabel>RECIPE</SectionLabel>
          <RecipeCard recipe={request.recipe} referenceUrls={request.referenceUrls ?? []} />
        </View>
      ) : null}
    </Stack>
  );
}
