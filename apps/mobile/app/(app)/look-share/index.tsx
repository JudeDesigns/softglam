import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Badge, Card, IconButton, Row, Screen, Stack, Text } from '@softglow/ui';

import { useSkinProfile } from '@/state/skin-profile';
import { LookThumb } from '@/try-on/components';
import {
  matchLabelForScore,
  rankSectionsForProfile,
  topLooksForProfile,
} from '@/look-share/ranking';
import { BAND_COPY, bandForScore } from '@/lib/skin-health';

const FEATURED_COUNT = 4;
const ROW_GAP = tokens.spacing[4];

export default function LookShareGallery() {
  const profile = useSkinProfile((s) => s.profile);

  const featured = useMemo(() => topLooksForProfile(profile, FEATURED_COUNT), [profile]);
  const sections = useMemo(() => rankSectionsForProfile(profile), [profile]);

  const scoreCopy = profile ? BAND_COPY[bandForScore(profile.healthScore)] : null;

  return (
    <Screen>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <IconButton
          icon={<Ionicons name="chevron-back" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/home'))}
        />
        <Stack gap={4} align="center">
          <Text variant="caption" tone="tertiary" weight="medium">LOOKS</Text>
          <Text variant="titleSm">Browse &amp; send</Text>
        </Stack>
        <View style={{ width: 40 }} />
      </Row>

      <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
        <Stack gap={tokens.spacing[3]}>
          <Badge label="Curated for you" tone="accent" onHero />
          <Text variant="titleSm" tone="onHero">
            {profile ? 'Looks shaped by your skin' : 'Browse the look library'}
          </Text>
          <Text variant="bodySm" tone="onHero" style={{ opacity: 0.92 }}>
            {profile && scoreCopy
              ? `Your Skin Health Score of ${profile.healthScore} (${scoreCopy.caption}) guides which finishes and shades sit best on you. Tap any look to preview it on your face and send it to your artist.`
              : 'Pick a look you love, upload a photo, and send a personalized preview straight to your in-app artist.'}
          </Text>
        </Stack>
      </Card>

      {profile ? (
        <View style={{ marginTop: tokens.spacing[8] }}>
          <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[4] }}>
            <Stack gap={4}>
              <Text variant="caption" tone="tertiary" weight="medium">YOUR TOP PICKS</Text>
              <Text variant="heading">Best matched for your skin</Text>
            </Stack>
          </Row>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: ROW_GAP,
            }}
          >
            {featured.map((look) => (
              <View key={look.id} style={{ width: '48.5%' }}>
                <LookThumb
                  look={look}
                  selected={false}
                  fluid
                  onPress={() => router.push(`/(app)/look-share/${look.id}`)}
                />
                <Text
                  variant="caption"
                  tone="accent"
                  weight="semibold"
                  style={{ marginTop: tokens.spacing[1] }}
                >
                  {matchLabelForScore(look.matchScore)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.id} style={{ marginTop: tokens.spacing[8] }}>
          <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[4] }}>
            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Text variant="caption" tone="tertiary" weight="medium">{section.title.toUpperCase()}</Text>
              <Text variant="heading">{section.subtitle}</Text>
            </Stack>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row align="start" gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[4] }}>
              {section.looks.map((look) => (
                <LookThumb
                  key={look.id}
                  look={look}
                  selected={false}
                  width={168}
                  onPress={() => router.push(`/(app)/look-share/${look.id}`)}
                />
              ))}
            </Row>
          </ScrollView>
        </View>
      ))}

      <View style={{ marginTop: tokens.spacing[10] }}>
        <Card padding={tokens.spacing[5]} elevation="sm">
          <Stack gap={tokens.spacing[3]}>
            <Text variant="caption" tone="tertiary" weight="medium">HOW IT WORKS</Text>
            <HowItWorksRow num={1} label="Pick a look you love" />
            <HowItWorksRow num={2} label="Upload a photo of you" />
            <HowItWorksRow num={3} label="We preview the look on your face" />
            <HowItWorksRow num={4} label="Send it to your artist with a note" />
          </Stack>
        </Card>
      </View>
    </Screen>
  );
}

function HowItWorksRow({ num, label }: { num: number; label: string }) {
  return (
    <Row align="center" gap={tokens.spacing[3]}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: tokens.colors.accent.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="caption" tone="accent" weight="bold">{num}</Text>
      </View>
      <Text variant="bodySm" style={{ flex: 1 }}>{label}</Text>
    </Row>
  );
}

// Pressable kept in case future reordering needs it; not currently used.
void Pressable;
