import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Button, IconButton, ProgressBar, Row, Screen, Stack, Text } from '@softglow/ui';

import { useSkinProfile } from '@/state/skin-profile';

interface QuizFrameProps {
  step: { current: number; total: number };
  title: string;
  caption?: string;
  children: ReactNode;
  /** Show a "Skip for now" affordance on the right of the header. */
  showSkip?: boolean;
  /** Primary CTA at the bottom. If omitted no footer is rendered. */
  primary?: { label: string; onPress: () => void; disabled?: boolean };
  secondary?: { label: string; onPress: () => void };
  contentStyle?: ViewStyle;
}

/**
 * Shared chrome for every onboarding screen: progress bar, back/skip header,
 * title block, and a sticky footer. Each step screen focuses on its own
 * decision UI and leaves layout to this frame.
 */
export function QuizFrame({
  step,
  title,
  caption,
  children,
  showSkip = true,
  primary,
  secondary,
  contentStyle,
}: QuizFrameProps) {
  const skipOnboarding = useSkinProfile((s) => s.skipOnboarding);
  const progress = step.current / step.total;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  };

  const handleSkip = () => {
    skipOnboarding();
    router.replace('/(app)/home');
  };

  return (
    <Screen scroll={false} padding={tokens.spacing[6]}>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <IconButton
          icon={<Ionicons name="chevron-back" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="Back"
          onPress={handleBack}
        />
        {showSkip ? (
          <IconButton
            icon={<Ionicons name="close" size={20} color={tokens.colors.text.primary} />}
            accessibilityLabel="Skip onboarding"
            onPress={handleSkip}
          />
        ) : null}
      </Row>

      <Stack gap={tokens.spacing[2]} style={{ marginBottom: tokens.spacing[5] }}>
        <Row justify="between" align="center">
          <Text variant="label" tone="tertiary">
            Step {step.current} of {step.total}
          </Text>
          <Text variant="label" tone="tertiary">
            {Math.round(progress * 100)}%
          </Text>
        </Row>
        <ProgressBar value={progress} />
      </Stack>

      <Stack gap={tokens.spacing[2]} style={{ marginBottom: tokens.spacing[5] }}>
        <Text variant="titleSm">{title}</Text>
        {caption ? (
          <Text variant="bodySm" tone="secondary">
            {caption}
          </Text>
        ) : null}
      </Stack>

      <View style={[{ flex: 1 }, contentStyle]}>{children}</View>

      {primary || secondary ? (
        <Row gap={tokens.spacing[3]} style={{ marginTop: tokens.spacing[4] }}>
          {secondary ? (
            <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} />
          ) : null}
          {primary ? (
            <View style={{ flex: 1 }}>
              <Button
                label={primary.label}
                variant="primary"
                fullWidth
                disabled={primary.disabled}
                onPress={primary.onPress}
              />
            </View>
          ) : null}
        </Row>
      ) : null}
    </Screen>
  );
}
