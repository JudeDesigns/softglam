import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Row, Screen, Stack, Text } from '@softglow/ui';

import { LooksHeader, V } from '@/look-share/components';
import { matchLabelForScore, rankSectionsForProfile, topLooksForProfile } from '@/look-share/ranking';
import { BAND_COPY, bandForScore } from '@/lib/skin-health';
import { useOpenDrafts } from '@/state/look-drafts';
import { useLookCatalog, useLookSections } from '@/state/looks';
import { useSkinProfile } from '@/state/skin-profile';
import { LookThumb } from '@/try-on/components';

const FEATURED_COUNT = 4;

/** Route 1 of the Looks tab: browse the curated catalog and pick a look to try. */
export default function LookLibrary() {
  const profile = useSkinProfile((s) => s.profile);
  const catalog = useLookSections();
  const fetchCatalog = useLookCatalog((s) => s.fetch);
  const openDrafts = useOpenDrafts();
  useEffect(() => { void fetchCatalog(); }, [fetchCatalog]);

  const featured = useMemo(() => topLooksForProfile(catalog, profile, FEATURED_COUNT), [catalog, profile]);
  const sections = useMemo(() => rankSectionsForProfile(catalog, profile), [catalog, profile]);
  const lookCount = catalog.reduce((n, s) => n + s.looks.length, 0);
  const scoreCopy = profile ? BAND_COPY[bandForScore(profile.healthScore)] : null;

  const open = (lookId: string) => router.push(`/(app)/look-share/${lookId}`);

  return (
    <Screen style={{ backgroundColor: V.bg }}>
      <LooksHeader
        eyebrow="LOOK LIBRARY"
        title="Browse looks"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(app)/look-share'))}
        openDraftCount={openDrafts.length}
      />

      <Text variant="bodySm" style={{ color: V.textSecondary }}>
        {profile && scoreCopy
          ? `${lookCount} looks, ordered by how well they suit your skin (score ${profile.healthScore}, ${scoreCopy.caption.toLowerCase()}). Tap one to try it on your photo.`
          : `${lookCount} looks from our artists. Tap one to try it on your photo, then send it to your artist.`}
      </Text>

      {profile ? (
        <View style={{ marginTop: tokens.spacing[7] }}>
          <SectionTitle eyebrow="YOUR TOP PICKS" title="Best matched for your skin" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: tokens.spacing[4] }}>
            {featured.map((look) => (
              <View key={look.id} style={{ width: '48.5%' }}>
                <LookThumb look={look} selected={false} fluid onPress={() => open(look.id)} />
                <Text variant="caption" weight="semibold" style={{ color: V.accent, marginTop: tokens.spacing[1] }}>
                  {matchLabelForScore(look.matchScore)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.id} style={{ marginTop: tokens.spacing[8] }}>
          <SectionTitle eyebrow={section.title.toUpperCase()} title={section.subtitle} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -tokens.spacing[6] }}>
            <Row align="start" gap={tokens.spacing[3]} style={{ paddingHorizontal: tokens.spacing[6] }}>
              {section.looks.map((look) => (
                <LookThumb key={look.id} look={look} selected={false} width={156} onPress={() => open(look.id)} />
              ))}
            </Row>
          </ScrollView>
        </View>
      ))}

      <View style={{ height: tokens.spacing[16] }} />
    </Screen>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Stack gap={4} style={{ marginBottom: tokens.spacing[4] }}>
      <Text variant="caption" weight="medium" style={{ color: V.textSecondary, letterSpacing: 1 }}>{eyebrow}</Text>
      <Text variant="heading" style={{ color: V.textPrimary }}>{title}</Text>
    </Stack>
  );
}
