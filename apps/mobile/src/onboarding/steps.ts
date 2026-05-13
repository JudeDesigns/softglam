import { SKIN_CONCERNS, type SkinConcern } from '@softglow/types';

export type OnboardingStep =
  | { kind: 'welcome'; route: '/(onboarding)/welcome' }
  | { kind: 'severity'; concern: SkinConcern; route: string }
  | { kind: 'tone'; route: '/(onboarding)/tone' }
  | { kind: 'type'; route: '/(onboarding)/type' }
  | { kind: 'calculating'; route: '/(onboarding)/calculating' }
  | { kind: 'result'; route: '/(onboarding)/result' };

/**
 * Linear flow. The store doesn't drive routing — each screen consults this
 * list to find its next/previous route. Keeps screens self-contained and
 * lets us deep-link any step during development.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  { kind: 'welcome', route: '/(onboarding)/welcome' },
  ...SKIN_CONCERNS.map<OnboardingStep>((concern) => ({
    kind: 'severity',
    concern,
    route: `/(onboarding)/severity/${concern}`,
  })),
  { kind: 'tone', route: '/(onboarding)/tone' },
  { kind: 'type', route: '/(onboarding)/type' },
  { kind: 'calculating', route: '/(onboarding)/calculating' },
  { kind: 'result', route: '/(onboarding)/result' },
];

export function indexOfRoute(route: string): number {
  return ONBOARDING_STEPS.findIndex((s) => s.route === route);
}

export function nextRoute(currentRoute: string): string | null {
  const i = indexOfRoute(currentRoute);
  if (i < 0 || i >= ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[i + 1]!.route;
}

export function progressFor(route: string): number {
  const i = indexOfRoute(route);
  if (i < 0) return 0;
  // Exclude welcome and result from the bar's denominator so the bar reads
  // "you're working on step X of N" rather than "you've started".
  const total = ONBOARDING_STEPS.length - 2;
  const value = Math.max(0, i - 1);
  return Math.min(1, value / total);
}
