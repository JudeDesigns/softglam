import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { tokens } from '@softglow/tokens';
import { SeverityIndicator, Row, Text } from '@softglow/ui';
import {
  CONCERN_LABELS,
  SKIN_CONCERNS,
  type SeverityLevel,
  type SkinConcern,
} from '@softglow/types';

import { QuizFrame } from '@/onboarding/quiz-frame';
import { ONBOARDING_STEPS, indexOfRoute, nextRoute } from '@/onboarding/steps';
import { useSkinProfile } from '@/state/skin-profile';

const LEVELS: SeverityLevel[] = [0, 1, 2, 3, 4];

const CONCERN_PROMPTS: Record<SkinConcern, { question: string; subtitle: string }> = {
  acne: { question: 'How is your breakout activity?', subtitle: 'Active blemishes today — not historical scarring.' },
  dryness: { question: 'How dry does your skin feel?', subtitle: 'Tightness, flaking, or rough patches.' },
  oiliness: { question: 'How oily does your skin get?', subtitle: 'Shine through the day, especially the T-zone.' },
  redness: { question: 'How red or flushed do you appear?', subtitle: 'Persistent redness, not post-workout flush.' },
  sensitivity: { question: 'How reactive is your skin?', subtitle: 'Stinging, itching, or flares from new products.' },
  darkCircles: { question: 'How visible are your dark circles?', subtitle: 'Color or shadow under the eyes.' },
  pores: { question: 'How visible are your pores?', subtitle: 'Especially around the nose and cheeks.' },
};

const LEVEL_LABELS: Record<SeverityLevel, string> = {
  0: 'None',
  1: 'Mild',
  2: 'Moderate',
  3: 'Significant',
  4: 'Severe',
};

function isConcern(value: string): value is SkinConcern {
  return (SKIN_CONCERNS as readonly string[]).includes(value);
}

export default function SeverityStep() {
  const { concern: concernParam } = useLocalSearchParams<{ concern: string }>();
  const concern = concernParam && isConcern(concernParam) ? concernParam : 'acne';

  const draftValue = useSkinProfile((s) => s.draft.concerns[concern]);
  const setSeverity = useSkinProfile((s) => s.setDraftConcernSeverity);

  const route = `/(onboarding)/severity/${concern}`;
  const stepIndex = useMemo(() => indexOfRoute(route), [route]);
  const totalSteps = ONBOARDING_STEPS.length - 2; // exclude welcome + result

  const handleNext = () => {
    if (draftValue === undefined) return;
    const next = nextRoute(route);
    if (next) router.push(next as never);
  };

  return (
    <QuizFrame
      step={{ current: stepIndex, total: totalSteps }}
      title={CONCERN_PROMPTS[concern].question}
      caption={CONCERN_PROMPTS[concern].subtitle}
      primary={{ label: 'Continue', onPress: handleNext, disabled: draftValue === undefined }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tokens.spacing[4] }}>
        <Row gap={tokens.spacing[3]} wrap justify="center">
          {LEVELS.map((level) => {
            const selected = draftValue === level;
            return (
              <Pressable
                key={level}
                onPress={() => setSeverity(concern, level)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${CONCERN_LABELS[concern]} ${LEVEL_LABELS[level]}`}
                style={{ alignItems: 'center', gap: tokens.spacing[2], width: '46%' }}
              >
                <View
                  style={{
                    borderRadius: tokens.radii.xl,
                    padding: 4,
                    borderWidth: 2,
                    borderColor: selected ? tokens.colors.accent.primary : 'transparent',
                  }}
                >
                  <SeverityIndicator concern={concern} level={level} size={140} />
                </View>
                <Text variant="label" tone={selected ? 'accent' : 'secondary'} weight="semibold">
                  {LEVEL_LABELS[level]}
                </Text>
                <Text variant="caption" tone="tertiary">
                  {concern === 'acne' && level === 0
                    ? 'No active breakouts'
                    : `${CONCERN_LABELS[concern]} — level ${level}`}
                </Text>
              </Pressable>
            );
          })}
        </Row>
      </ScrollView>
    </QuizFrame>
  );
}
