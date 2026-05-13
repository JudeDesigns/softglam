import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Button, Card, MetricPill, RadialGauge, Row, Screen, Stack, Text } from '@softglow/ui';
import { CONCERN_LABELS, topConcerns as pickTopConcerns } from '@softglow/types';

import { useSkinProfile } from '@/state/skin-profile';
import { BAND_COPY, bandForScore } from '@/lib/skin-health';

export default function ResultStep() {
  const profile = useSkinProfile((s) => s.profile);

  if (!profile) {
    router.replace('/(onboarding)/welcome');
    return null;
  }

  const band = bandForScore(profile.healthScore);
  const copy = BAND_COPY[band];
  const top = pickTopConcerns(profile.concerns, 3);

  return (
    <Screen>
      <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[6]}>
        <Stack align="center" gap={tokens.spacing[3]}>
          <Text variant="label" tone="onHero">Your Skin Health Score</Text>
          <RadialGauge value={profile.healthScore} size={220} thickness={16} onHero caption={copy.caption} />
          <Text variant="heading" tone="onHero" align="center">
            {copy.headline}
          </Text>
        </Stack>
      </Card>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Text variant="heading" style={{ marginBottom: tokens.spacing[3] }}>
          What we&apos;re tracking
        </Text>
        {top.length === 0 ? (
          <Card padding={tokens.spacing[5]} elevation="sm">
            <Text variant="bodySm" tone="secondary">
              No active concerns flagged. You&apos;ll see new readings each time you re-assess.
            </Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap={tokens.spacing[4]} style={{ paddingHorizontal: tokens.spacing[1] }}>
              {top.map((c) => (
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
        )}
      </View>

      <Card padding={tokens.spacing[5]} elevation="sm" style={{ marginTop: tokens.spacing[6] }}>
        <Stack gap={tokens.spacing[2]}>
          <Text variant="heading">Next: tag specific zones</Text>
          <Text variant="bodySm" tone="secondary">
            Use the Smart Reticle on the Scan tab to mark exactly where your concerns sit.
            Your score will refine as you add detail.
          </Text>
        </Stack>
      </Card>

      <View style={{ marginTop: tokens.spacing[8] }}>
        <Button
          label="Go to home"
          variant="primary"
          fullWidth
          onPress={() => router.replace('/(app)/home')}
        />
      </View>
    </Screen>
  );
}
