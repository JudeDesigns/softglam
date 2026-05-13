import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Row, Stack, Text } from '@softglow/ui';
import type { SkinToneTier } from '@softglow/types';

import { QuizFrame } from '@/onboarding/quiz-frame';
import { ONBOARDING_STEPS, indexOfRoute, nextRoute } from '@/onboarding/steps';
import { useSkinProfile } from '@/state/skin-profile';

/**
 * Fitzpatrick-aligned tier swatches. Stored as 1..6 on the profile so we can
 * surface tier-appropriate makeup palettes later without revisiting the UI.
 */
const TIER_SWATCHES: Array<{ tier: SkinToneTier; color: string; label: string }> = [
  { tier: 1, color: '#F4DDC7', label: 'Type I' },
  { tier: 2, color: '#E8C5A4', label: 'Type II' },
  { tier: 3, color: '#D2A47C', label: 'Type III' },
  { tier: 4, color: '#A87850', label: 'Type IV' },
  { tier: 5, color: '#75502F', label: 'Type V' },
  { tier: 6, color: '#3F2A1B', label: 'Type VI' },
];

export default function ToneStep() {
  const draftValue = useSkinProfile((s) => s.draft.toneTier);
  const setTone = useSkinProfile((s) => s.setDraftTone);

  const route = '/(onboarding)/tone';
  const stepIndex = useMemo(() => indexOfRoute(route), []);
  const totalSteps = ONBOARDING_STEPS.length - 2;

  const handleNext = () => {
    if (draftValue === null) return;
    const next = nextRoute(route);
    if (next) router.push(next as never);
  };

  return (
    <QuizFrame
      step={{ current: stepIndex, total: totalSteps }}
      title="Pick your closest skin tone"
      caption="We use this to match makeup shades and to calibrate your reports."
      primary={{ label: 'Continue', onPress: handleNext, disabled: draftValue === null }}
    >
      <Row gap={tokens.spacing[3]} wrap justify="center">
        {TIER_SWATCHES.map((s) => {
          const selected = draftValue === s.tier;
          return (
            <Pressable
              key={s.tier}
              onPress={() => setTone(s.tier)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{ alignItems: 'center', width: '28%' }}
            >
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: s.color,
                  borderWidth: 3,
                  borderColor: selected ? tokens.colors.accent.primary : tokens.colors.border.subtle,
                  ...tokens.shadow.sm,
                }}
              />
              <Stack gap={tokens.spacing[1]} align="center" style={{ marginTop: tokens.spacing[2] }}>
                <Text variant="label" tone={selected ? 'accent' : 'secondary'} weight="semibold">
                  {s.label}
                </Text>
                <Text variant="caption" tone="tertiary">
                  Tier {s.tier}
                </Text>
              </Stack>
            </Pressable>
          );
        })}
      </Row>
    </QuizFrame>
  );
}
