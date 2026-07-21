# Mobile UI/UX Improvement Guide (React Native / Expo)

## Purpose
Use this guide to audit and improve this app's UI/UX. Apply every rule below.

**CRITICAL CONSTRAINT: Do not change the existing color palette.** Keep all current
brand colors, accent colors, and theme tokens exactly as they are defined in the
project (theme file, design tokens, Tailwind/NativeWind config, or StyleSheet
constants — wherever colors are currently defined). Where a rule below requires a
color (e.g., an error state, a disabled state, a focus ring), derive it from the
**existing palette** (e.g., a tint/shade of the current primary/accent color, or the
existing semantic colors already defined) rather than introducing new brand colors.
If no semantic color exists yet for a required state (success/error/warning/disabled),
generate one as a tint of an existing neutral or accent color, and flag it for review
rather than inventing an unrelated new color.

Everything else below (spacing, sizing, typography, motion, structure, performance,
accessibility) should be applied and corrected as needed.

---

## 1. Touch Ergonomics (Fitts' Law & Thumb Zone)

- **Minimum touch target size: 44x44pt (iOS) / 48x48dp (Android).** Audit every
  button, icon button, list row action, checkbox, and tab bar item. Pad hit areas
  even if the visible icon is smaller (use `hitSlop` in React Native rather than
  visually enlarging small icons).
- **Primary actions belong in the thumb zone** — the bottom third to bottom half of
  the screen, reachable without shifting grip. Move primary CTAs (submit, continue,
  add, confirm) to the bottom of the screen or into a sticky bottom bar rather than
  the top, especially on larger phones.
- **Destructive or rarely-used actions go in harder-to-reach zones** (top corners),
  never in the easy-reach thumb zone, to prevent accidental taps.
- **Space out adjacent tappable elements** by at least 8pt to avoid mis-taps —
  check list rows with multiple inline actions (edit/delete icons) especially.
- **Avoid nested scrollable regions with small draggable handles** — these are the
  most common Fitts'-Law violation in RN apps (horizontal carousels inside vertical
  scrollviews with tiny scroll indicators).

## 2. Platform Conventions

### iOS (Apple Human Interface Guidelines)
- Navigation: back button top-left with system chevron + label, not custom
  hamburger patterns unless intentional.
- Typography: respect Dynamic Type — use scalable font sizes, not fixed pixel
  values, so text respects the user's accessibility text-size setting.
  In React Native, use `allowFontScaling` (leave enabled; don't disable it).
- Modals/sheets: prefer native-feeling bottom sheets and `pageSheet`/`formSheet`
  presentation styles over full custom overlays.
- Tab bars: max 5 items, icon + label, standard height, safe-area aware.
- Haptics: use light haptic feedback on primary confirmations (already common via
  `expo-haptics`) — check it's actually wired up on button presses, not just visual.

### Android (Material Design 3)
- Navigation: system back gesture/button must always work — never trap the user
  in a screen without a working back action.
- Elevation/shadows: use Material's elevation levels for depth (cards, sheets,
  app bars) rather than arbitrary custom box-shadows.
- Ripple feedback on all touchables (`android_ripple` prop on Pressable) instead of
  iOS-style opacity-only feedback, which feels foreign to Android users.
- FAB (Floating Action Button) conventions if a primary "add" action exists —
  bottom-right placement, circular, single primary color from the existing palette.

### Cross-platform discipline
- Don't apply iOS-only patterns (like swipe-back gesture assumptions) uniformly to
  Android, and vice versa. Use `Platform.select()` / `Platform.OS` checks for any
  place where the "correct" pattern genuinely differs, rather than picking one
  platform's convention and forcing it everywhere.

## 3. Layout & Spacing System

- Establish and enforce a consistent spacing scale (e.g., 4/8/12/16/24/32pt) —
  audit the codebase for arbitrary one-off margin/padding values (e.g., `13`, `17`,
  `22`) and normalize them to the nearest scale step.
- Consistent screen-edge padding (typically 16–20pt) across all screens — check for
  screens that don't match the rest of the app.
- Respect safe areas on all screens (notch, home indicator, status bar) using
  `SafeAreaView` / `useSafeAreaInsets` — check for content hidden behind the notch
  or the home-indicator gesture bar, especially on modal/full-screen views.
- Consistent corner radius scale across buttons, cards, inputs, and sheets — avoid
  mixing sharp and heavily rounded corners across similar components.

## 4. Typography

- Establish a clear, limited type scale (e.g., Display, Title, Body, Caption —
  4-6 sizes max) and audit for one-off font sizes scattered through the code.
- Consistent line-height ratios (typically 1.2–1.5x font size) — check for cramped
  or overly loose text blocks.
- Consistent font-weight usage for hierarchy (e.g., bold for titles/CTAs, regular
  for body) rather than relying on size alone to indicate importance.
- Minimum body text size of 14-16pt for readability; avoid sub-12pt text except
  for true captions/legal text.

## 5. Motion & Animation

- Use platform-appropriate easing curves: ease-in-out for most transitions, spring
  physics for gesture-driven interactions (drag, swipe-to-dismiss) rather than
  linear timing, which feels robotic.
- Standard duration ranges: 150-250ms for small UI transitions (button press,
  toggle), 250-400ms for screen transitions, avoid anything above ~500ms for
  routine interactions — it reads as sluggish.
- **Respect reduced-motion accessibility settings** — check
  `AccessibilityInfo.isReduceMotionEnabled()` and skip or shorten decorative
  animations for users with that setting enabled. Do not skip functionally
  necessary motion cues (like a loading indicator), only decorative ones.
- Avoid animating properties that force layout recalculation (`width`, `height`,
  `top`/`left`) — animate `transform` and `opacity` instead, using the native
  driver (`useNativeDriver: true`) wherever possible for 60fps performance.
- Every loading/async state should have a visible transition (skeleton, spinner,
  fade-in) — audit for any screen that "pops" content in with no transition at all,
  which feels broken rather than fast.

## 6. Performance Patterns (feeds directly into "feels right")

Janky UI often isn't a design problem, it's a performance problem. Audit for:
- Long lists using `FlatList`/`FlashList` with proper `keyExtractor`, not `.map()`
  inside a `ScrollView` for anything with more than ~15-20 items.
- Expensive inline functions/objects passed as props inside list renderers —
  wrap with `useCallback`/`useMemo` where it affects re-render frequency.
- Images sized appropriately for their display size (not loading a 4000px image
  into a 100px thumbnail) — use `expo-image` with proper `contentFit` and caching
  rather than the bare `Image` component if not already doing so.
- No unnecessary re-renders on every keystroke in forms — check controlled inputs
  aren't causing full-screen re-renders.

## 7. Accessibility

- Color contrast: check text-on-background contrast ratios meet at least WCAG AA
  (4.5:1 for body text, 3:1 for large text) **using the existing color palette** —
  if a contrast issue exists, prefer adjusting the *shade/tint* of an existing color
  (lighter/darker version of the same brand color) rather than swapping in an
  unrelated color.
- All interactive elements have `accessibilityLabel` / `accessibilityRole` set —
  audit icon-only buttons especially, since these are the most commonly missed.
- Form inputs have associated labels (not just placeholder text, which disappears
  on input and isn't reliably read by screen readers).
- Focus order is logical for screen reader navigation (top to bottom, left to
  right, matching visual order).

## 8. Component-Level Checklist

Go screen by screen and check each of these:

- [ ] Buttons: consistent height, padding, corner radius, and states (default,
      pressed, disabled, loading) — using existing palette for each state.
- [ ] Forms: consistent input height, label placement, error-message styling and
      placement, keyboard type matches input purpose (numeric, email, etc.).
- [ ] Lists: consistent row height/padding, clear separators or card spacing,
      empty-state and loading-state designs present (not blank screens).
- [ ] Navigation bars/headers: consistent height, title alignment, back-button
      behavior, safe-area handling.
- [ ] Modals/sheets: consistent entrance/exit animation, dismiss affordance
      (swipe down, X button, or backdrop tap — pick one convention and use it
      everywhere), safe-area-aware bottom padding.
- [ ] Empty/error/loading states exist for every async screen, not just the
      happy path.

---

## How to brief your AI coder with this file

Give an instruction along these lines:

> "Read `mobile-ui-guide.md`. Audit the current app screen by screen against every
> section. For each violation found, tell me the file and line, what's wrong, and
> the specific fix. Do not change any existing color values — only adjust spacing,
> sizing, typography, motion, structure, or accessibility attributes. If a new
> semantic color state is genuinely needed (e.g., a disabled or error color) and
> none exists, propose a tint of an existing color rather than a new one, and flag
> it for my approval before applying it."
