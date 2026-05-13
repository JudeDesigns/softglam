import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Screen, Stack, Text } from '@softglow/ui';

import { useSkinProfile } from '@/state/skin-profile';

/**
 * Brief intermission so the score transition doesn't feel instant. The commit
 * itself is synchronous; we wait ~1.4s for the animation/perception beat and
 * then route to the result screen.
 */
const DELAY_MS = 1400;

export default function CalculatingStep() {
  const commitDraft = useSkinProfile((s) => s.commitDraft);

  useEffect(() => {
    const committed = commitDraft();
    if (!committed) {
      router.replace('/(onboarding)/tone');
      return;
    }
    const id = setTimeout(() => {
      router.replace('/(onboarding)/result');
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, [commitDraft]);

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[5] }}>
        <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
        <Stack gap={tokens.spacing[2]} align="center">
          <Text variant="titleSm" align="center">Reading your skin</Text>
          <Text variant="bodySm" tone="secondary" align="center">
            Weighing your concerns against the SQS framework…
          </Text>
        </Stack>
      </View>
    </Screen>
  );
}
