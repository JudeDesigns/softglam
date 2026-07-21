# Design Concept: "The Vanity" — A Design System for This App

## Direction, in one sentence
This app should feel like a private vanity mirror in a warmly lit atelier, not a
drugstore shelf. Every generic beauty app defaults to bubblegum pastels + rounded
product cards (pure e-commerce mode) or sterile clinical white (pure skincare-science
mode). This app does neither — it should feel intimate, editorial, and a little
luxurious, because it isn't just a shop, it's a mirror, a routine coach, and a
direct line to a real artist.

**The signature element:** a recurring "mirror-frame" motif — a soft, thin arched
border (like a vanity mirror frame) used as the container for the two most personal
moments in the app: the AI look-generation result and the user's own profile/skin
progress photo. Nowhere else. This makes those two moments feel deliberately framed
and important, rather than every card in the app looking identical.

---

## 1. Color System

If you already have brand colors, treat this as the *expanded palette* — extend
your existing accent into the roles below via tints/shades rather than replacing it.
If you're open to a full palette, here is a complete, named system:

| Role | Name | Hex | Use |
|---|---|---|---|
| Base | Vellum | `#FAF6F1` | Primary background — warm off-white, not stark white |
| Base Deep | Espresso | `#2B211D` | Dark mode background / high-contrast text |
| Primary | Rose Clay | `#C97B6A` | Primary buttons, active states, key accents |
| Primary Deep | Umber Rose | `#8A4A3E` | Pressed states, headers on light bg |
| Secondary | Champagne | `#E8C79A` | Secondary accents, badges, shop highlights |
| Accent (rare) | Plum Velvet | `#5B2A4A` | Premium/MUA-tier features only — used sparingly so it stays special |
| Success/Routine | Sage | `#8A9A7E` | Routine streaks, completed steps |
| Neutral text | Warm Charcoal | `#3A332F` | Body text on light backgrounds |
| Neutral line | Sand | `#E4D9CD` | Dividers, card borders, input borders |

**Rule:** Plum Velvet is reserved exclusively for MUA/premium-tier moments (booking a
real artist, premium look packs) so that it always signals "this is elevated," never
used for routine UI chrome. This scarcity is what makes it feel premium instead of
just being "another purple."

**Dark mode isn't optional here** — a huge amount of this app's use (evening skincare
routine, browsing at night) happens in low light. Design Espresso-based dark mode
from day one, not as an afterthought inversion.

## 2. Typography

- **Display face:** a warm, slightly high-contrast serif (e.g., a Canela/Fraunces/
  Playfair-family font) for screen titles, the AI-generated look result headline, and
  the artist's name in chat/booking screens. This is what signals "editorial," not
  "app template" — most competing apps use only a rounded sans everywhere.
- **Body/UI face:** a clean geometric or humanist sans (e.g., Inter, General Sans,
  or similar already likely in your project) for everything functional — buttons,
  lists, form fields, chat bubbles.
- **Never mix serif into dense UI chrome** (buttons, tab bars, form labels) — it's
  reserved for the emotional, personal moments: the look reveal, routine milestones,
  artist names. This restraint is what keeps it from feeling like a wedding invite.

## 3. The "Mirror Frame" Signature Component

Build one reusable component: a rounded-arch frame (flat top corners, softly arched
bottom, like a hand mirror) with a thin 1.5pt border in Sand or Champagne, subtle
inner shadow, and a soft ambient glow behind it (a blurred radial gradient in Rose
Clay at ~15% opacity sitting behind the frame).

Use this frame **only** for:
1. The AI-generated look result (the "reveal" moment).
2. The user's own current profile/skin photo on their routine/progress screen.

Do not reuse this frame for product photos, artist photos, or general cards — its
power comes from exclusivity. Everything else uses a plain rounded rectangle (12-16pt
radius) so the mirror frame reads as special the instant it appears.

## 4. Motion Concept

Motion should reinforce two feelings: **reveal** (for the AI look generation) and
**care/ritual** (for routines). Avoid generic slide/fade transitions everywhere —
pick a small number of specific, meaningful motions and repeat them consistently:

- **The Reveal:** when an AI-generated look finishes processing, don't just pop the
  image in. Do a soft cross-fade + gentle scale-up (0.96 → 1.0) over ~400ms combined
  with a brief shimmer sweep (a diagonal light-gradient pass across the mirror frame,
  ~600ms) as the final image settles in. This is the single moment worth spending
  your "animation budget" on — make it feel like a mirror clearing after steam.
- **Routine check-off:** when a user marks a skincare step complete, a small Sage-
  colored checkmark draws itself (path animation, ~250ms) rather than instantly
  appearing, plus a subtle scale-bounce on the step card (1.0 → 1.03 → 1.0).
- **Streak/progress:** progress rings or bars fill with an eased animation
  (ease-out, ~500-700ms) whenever the routine or skin-progress screen opens, not
  instantly — this is a small ritual moment, let it breathe.
- **Chat with artists:** standard, fast, unremarkable transitions (messaging should
  feel quick and native, not decorative — don't apply the "precious" motion language
  here, save it for the beauty moments).
- **Shop:** standard e-commerce motion (quick fades, standard list transitions) —
  the shop is the utilitarian part of the app; it should feel efficient, not slow
  and ceremonial. Contrast is the point: routine/AI-look = slow and intentional,
  shop/chat = fast and efficient. That contrast itself communicates "this app
  understands the difference between a ritual and a transaction."
- Respect reduced-motion settings: shorten or remove the shimmer/bounce flourishes,
  but keep functional motion (loading states, progress fills) intact.

## 5. Layout Concepts by Screen

**Home / Today's Routine**
A single vertical "ritual list" — morning and evening routine steps as a checklist,
not a dashboard of widgets. Keep it calm: one clear focal action at a time (today's
next step), not a cluttered grid. A slim horizontal streak/progress indicator at the
top, Sage-colored.

**AI Look Generator**
Full-bleed, camera/photo-first. The mirror-frame component holds the result. Controls
(style selection, intensity, regenerate) live in a bottom sheet below the frame so
the frame — the actual result — stays the visual hero, not squeezed beside a toolbar.

**Shop**
A bento-style grid (mixed card sizes: a couple of large featured-product tiles, then
smaller uniform tiles) rather than one uniform grid — this is the one place a
"trendy" bento layout is justified, since a shop genuinely has featured vs. regular
items. Product cards: plain rounded rectangle, no mirror-frame treatment.

**Chat with Makeup Artists**
Standard, familiar messaging UI (don't over-design this — people need chat to feel
instantly usable). One distinct touch: the artist's name/header uses the display
serif face, everything else in chat uses the standard body sans, so it's clear who
you're really talking to.

**Payment**
Minimal, quiet, high-trust: neutral background (Vellum), Espresso text, Rose Clay
for the single confirm button, no decorative motion here at all. Payment screens are
the one place where "boring and clear" beats "distinctive" — never make someone
hesitate during checkout because something is animating or unfamiliar.

## 6. What NOT to do (avoiding the generic-beauty-app trap)

- Don't default to an all-pastel-pink palette with rounded bubble buttons everywhere
  — that's the single most common "beauty app" template and will read as generic
  regardless of how polished the execution is.
- Don't apply decorative animation uniformly across every screen — the contrast
  between ritual screens (slow, intentional) and utility screens (fast, efficient)
  is more distinctive than making everything equally "fancy."
- Don't reuse the mirror-frame signature component everywhere "because it looks
  nice" — its value depends on it being rare.
- Don't let the shop's e-commerce patterns bleed into the routine/AI-look
  experience, or vice versa — they should feel like two coherent but distinct modes
  within one app, unified by typography and color, not by identical layouts.

---

## Brief for your AI coder

> "Read `beauty-app-design-concept.md`. Implement the color system as theme tokens
> (extending/aligning with any existing brand colors already in the project — don't
> discard them, integrate them into this expanded palette). Build the mirror-frame
> component as a single reusable component used only where specified. Apply the
> typography split (serif for emotional/display moments, sans for UI chrome)
> consistently. Implement the specific motion patterns described for the AI look
> reveal and routine check-off — do not add generic animation elsewhere. Redesign
> screen layouts per the per-screen concepts, keeping shop and chat intentionally
> more utilitarian/less ornamented than the routine and AI-look screens."
