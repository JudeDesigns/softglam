import { View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Badge, Button, Card, Row, Screen, Stack, Text } from '@softglow/ui';

import { useSkinProfile } from '@/state/skin-profile';

const BULLETS: Array<{ title: string; body: string }> = [
  {
    title: 'Pick the tile that looks like you',
    body: 'Seven concerns, four severity levels each. No selfies required.',
  },
  {
    title: 'Get a score grounded in research',
    body: 'Mapped to dermatology-led research on skin health.',
  },
  {
    title: 'See products matched to your concerns',
    body: 'Ranked by overlap with what you flagged — not by margin.',
  },
];

export default function Welcome() {
  const resumeOnboarding = useSkinProfile((s) => s.resumeOnboarding);

  const handleStart = () => {
    resumeOnboarding();
    router.push('/(onboarding)/severity/acne');
  };

  const handleSkip = () => {
    useSkinProfile.getState().skipOnboarding();
    router.replace('/(app)/home');
  };

  return (
    <Screen>
      <Stack gap={tokens.spacing[3]} style={{ marginTop: tokens.spacing[6] }}>
        <Badge label="2 minutes" tone="accent" />
        <Text variant="title">Let&apos;s read your skin</Text>
        <Text variant="body" tone="secondary">
          A quick guided check-in so Softglow can show you what actually
          matters for your skin today.
        </Text>
      </Stack>

      <View style={{ marginTop: tokens.spacing[8], gap: tokens.spacing[3] }}>
        {BULLETS.map((b, i) => (
          <Card key={b.title} padding={tokens.spacing[5]} elevation="sm">
            <Row gap={tokens.spacing[4]} align="start">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: tokens.colors.accent.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="label" tone="accent" weight="bold">
                  {i + 1}
                </Text>
              </View>
              <Stack gap={tokens.spacing[1]} style={{ flex: 1 }}>
                <Text variant="heading">{b.title}</Text>
                <Text variant="bodySm" tone="secondary">
                  {b.body}
                </Text>
              </Stack>
            </Row>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: tokens.spacing[8], gap: tokens.spacing[3] }}>
        <Button label="Begin check-in" variant="primary" fullWidth onPress={handleStart} />
        <Button label="Skip for now" variant="ghost" fullWidth onPress={handleSkip} />
      </View>
    </Screen>
  );
}
