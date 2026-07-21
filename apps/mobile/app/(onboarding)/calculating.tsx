import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Screen, Stack, Text } from '@softglow/ui';

import { useSkinProfile } from '@/state/skin-profile';

/**
 * Brief intermission so the score transition doesn't feel instant. commitDraft
 * now syncs to the API; we wait for it and then route to the result screen.
 */
const DELAY_MS = 1400;

export default function CalculatingStep() {
  const commitDraft = useSkinProfile((s) => s.commitDraft);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const committed = await commitDraft();
      if (cancelled) return;
      if (!committed) {
        router.replace('/(onboarding)/tone');
        return;
      }
      timer = setTimeout(() => {
        router.replace('/(onboarding)/result');
      }, DELAY_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [commitDraft]);

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[5] }}>
        <ActivityIndicator size="large" color={tokens.colors.accent.primary} />
        <Stack gap={tokens.spacing[2]} align="center">
          <Text variant="titleSm" align="center">Reading your skin</Text>
          <Text variant="bodySm" tone="secondary" align="center">
            Weighing your concerns and shaping your score…
          </Text>
        </Stack>
      </View>
    </Screen>
  );
}
