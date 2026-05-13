import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { Stack, Text } from '@softglow/ui';
import type { SkinType } from '@softglow/types';

import { QuizFrame } from '@/onboarding/quiz-frame';
import { ONBOARDING_STEPS, indexOfRoute, nextRoute } from '@/onboarding/steps';
import { useSkinProfile } from '@/state/skin-profile';

const OPTIONS: Array<{ value: SkinType; title: string; body: string }> = [
  { value: 'oily', title: 'Oily', body: 'Shiny within hours of cleansing; visible pores.' },
  { value: 'dry', title: 'Dry', body: 'Tight, flaky, or rough most days.' },
  { value: 'combination', title: 'Combination', body: 'Oily T-zone, drier cheeks.' },
  { value: 'normal', title: 'Normal', body: 'Balanced — neither overly oily nor dry.' },
  { value: 'sensitive', title: 'Sensitive', body: 'Reactive, easily flushed or itchy.' },
];

export default function TypeStep() {
  const draftValue = useSkinProfile((s) => s.draft.type);
  const setType = useSkinProfile((s) => s.setDraftType);

  const route = '/(onboarding)/type';
  const stepIndex = useMemo(() => indexOfRoute(route), []);
  const totalSteps = ONBOARDING_STEPS.length - 2;

  const handleNext = () => {
    if (draftValue === null) return;
    const next = nextRoute(route);
    if (next) router.replace(next as never);
  };

  return (
    <QuizFrame
      step={{ current: stepIndex, total: totalSteps }}
      title="How would you describe your skin type?"
      caption="Your best guess is fine — you can refine this later."
      primary={{ label: 'Continue', onPress: handleNext, disabled: draftValue === null }}
    >
      <View style={{ gap: tokens.spacing[3] }}>
        {OPTIONS.map((opt) => {
          const selected = draftValue === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setType(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={{
                padding: tokens.spacing[5],
                borderRadius: tokens.radii.xl,
                borderWidth: 2,
                borderColor: selected ? tokens.colors.accent.primary : tokens.colors.border.subtle,
                backgroundColor: selected
                  ? tokens.colors.accent.primarySoft
                  : tokens.colors.surface.solid,
              }}
            >
              <Stack gap={tokens.spacing[1]}>
                <Text variant="heading" tone={selected ? 'accent' : 'primary'}>
                  {opt.title}
                </Text>
                <Text variant="bodySm" tone="secondary">
                  {opt.body}
                </Text>
              </Stack>
            </Pressable>
          );
        })}
      </View>
    </QuizFrame>
  );
}
