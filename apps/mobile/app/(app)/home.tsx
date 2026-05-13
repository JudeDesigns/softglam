import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  MetricPill,
  ProductCard,
  RadialGauge,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
} from '@softglow/ui';
import { CONCERN_LABELS, topConcerns as pickTopConcerns } from '@softglow/types';

import { useSession } from '@/state/session';
import { useSkinProfile } from '@/state/skin-profile';
import { PRODUCT_CATALOG, rankProducts } from '@/data/products';
import { BAND_COPY, bandForScore } from '@/lib/skin-health';

export default function Home() {
  const { role } = useSession();
  const profile = useSkinProfile((s) => s.profile);
  const onboardingSkipped = useSkinProfile((s) => s.onboardingSkipped);
  const resumeOnboarding = useSkinProfile((s) => s.resumeOnboarding);

  const topConcerns = useMemo(
    () => (profile ? pickTopConcerns(profile.concerns, 3) : []),
    [profile],
  );

  const recommended = useMemo(
    () => rankProducts(PRODUCT_CATALOG, topConcerns.map((c) => c.concern)),
    [topConcerns],
  );

  if (role === 'artist') return <ArtistHome />;

  const startAssessment = () => {
    resumeOnboarding();
    router.push('/(onboarding)/welcome');
  };

  return (
    <Screen>
      <Header name="Sara" />
      {profile ? (
        <PostAssessmentHero score={profile.healthScore} />
      ) : (
        <PreAssessmentHero skipped={onboardingSkipped} onStart={startAssessment} />
      )}

      {profile && topConcerns.length > 0 ? (
        <View style={{ marginTop: tokens.spacing[6] }}>
          <SectionHeader title="Focus areas" caption="Your top three concerns" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap={tokens.spacing[4]} style={{ paddingHorizontal: tokens.spacing[1] }}>
              {topConcerns.map((c) => (
                <MetricPill
                  key={c.concern}
                  label={CONCERN_LABELS[c.concern]}
                  value={(c.severity / 4) * 100}
                  displayValue={`${c.severity}/4`}
                  tone={c.severity >= 3 ? 'danger' : c.severity >= 2 ? 'warning' : 'accent'}
                />
              ))}
            </Row>
          </ScrollView>
        </View>
      ) : null}

      <View style={{ marginTop: tokens.spacing[8] }}>
        <SectionHeader
          title={profile ? 'Recommended for you' : 'Popular right now'}
          caption={profile ? 'Curated from your top concerns' : 'Trending in the SoftGlow shop'}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row align="start" gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[4] }}>
            {recommended.slice(0, 6).map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                brand={p.brand}
                price={p.price}
                badge={p.badge}
                onPress={() => {}}
              />
            ))}
          </Row>
        </ScrollView>
      </View>
    </Screen>
  );
}

function Header({ name }: { name: string }) {
  return (
    <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[6] }}>
      <View>
        <Text variant="bodySm" tone="secondary">Good morning,</Text>
        <Text variant="title">{name}</Text>
      </View>
      <Row gap={tokens.spacing[2]}>
        <IconButton
          icon={<Ionicons name="notifications-outline" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="Notifications"
        />
        <Avatar name={name} size="md" />
      </Row>
    </Row>
  );
}

function PreAssessmentHero({ skipped, onStart }: { skipped: boolean; onStart: () => void }) {
  return (
    <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
      <Stack gap={tokens.spacing[3]}>
        <Badge label={skipped ? 'Resume' : 'Start here'} tone="accent" />
        <Text variant="titleSm" tone="onHero">
          {skipped ? 'Pick up where you left off' : 'Get your Skin Health Score'}
        </Text>
        <Text variant="bodySm" tone="onHero" style={{ opacity: 0.9 }}>
          A 2-minute self-assessment scored against the Skin Quality Assessment Scale.
          No selfies required.
        </Text>
        <Button label={skipped ? 'Resume assessment' : 'Begin assessment'} variant="onHero" onPress={onStart} />
      </Stack>
    </Card>
  );
}

function PostAssessmentHero({ score }: { score: number }) {
  const band = bandForScore(score);
  const copy = BAND_COPY[band];
  return (
    <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
      <Stack align="center" gap={tokens.spacing[3]}>
        <Text variant="label" tone="onHero">Skin Health Score</Text>
        <RadialGauge value={score} size={220} thickness={16} onHero caption={copy.caption} />
        <Text variant="heading" tone="onHero" align="center">
          {copy.headline}
        </Text>
      </Stack>
    </Card>
  );
}

function ArtistHome() {
  return (
    <Screen>
      <Header name="Alex" />
      <Card padding={tokens.spacing[6]} elevation="md">
        <Stack gap={tokens.spacing[2]}>
          <Text variant="label" tone="secondary">Today</Text>
          <Text variant="title">3 appointments</Text>
          <Text variant="bodySm" tone="secondary">Next at 10:30 — Bridal trial with Priya</Text>
        </Stack>
      </Card>
      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader title="Quick actions" />
        <Row gap={tokens.spacing[3]} wrap>
          <Button label="New appointment" variant="primary" />
          <Button label="Log expense" variant="secondary" />
        </Row>
      </View>
    </Screen>
  );
}
