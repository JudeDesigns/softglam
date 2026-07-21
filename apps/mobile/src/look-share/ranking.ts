import type { SkinProfile, SkinConcern, SkinType } from '@softglow/types';
import { LOOK_SECTIONS, type LookSection, type MakeupLook } from '@/try-on/looks';

/**
 * Per-look affinity tags. Keeps the look data untouched — when the backend
 * provides real metadata this lookup is replaced wholesale. Each tag set is a
 * hand-curated guess based on shade palette + finish + section.
 */
interface LookAffinity {
  /** Skin types this look reads well on. */
  types?: SkinType[];
  /** Concerns this look helps disguise or complement (boost). */
  helpsConcerns?: SkinConcern[];
  /** Concerns this look tends to emphasise (penalty). */
  emphasisesConcerns?: SkinConcern[];
}

const AFFINITY: Record<string, LookAffinity> = {
  'bronze-couture': { types: ['normal', 'combination'], helpsConcerns: ['darkCircles'], emphasisesConcerns: ['oiliness'] },
  'liquid-gold': { types: ['dry', 'normal'], helpsConcerns: ['dryness'], emphasisesConcerns: ['oiliness'] },
  'smoke-mirrors': { types: ['oily', 'combination'], helpsConcerns: ['redness'], emphasisesConcerns: ['darkCircles'] },
  'velvet-plum': { types: ['normal', 'oily'], helpsConcerns: ['darkCircles'] },
  'rose-veil': { types: ['sensitive', 'dry', 'normal'], helpsConcerns: ['redness', 'sensitivity'] },
  'champagne-glow': { types: ['dry', 'normal'], helpsConcerns: ['dryness'], emphasisesConcerns: ['oiliness'] },
  'soft-sculpt': { types: ['normal', 'combination', 'sensitive'], helpsConcerns: ['redness', 'pores'] },
  'pearl-lustre': { types: ['dry', 'normal'], helpsConcerns: ['darkCircles'] },
  'bare-plus': { types: ['sensitive', 'normal', 'dry'], helpsConcerns: ['redness', 'sensitivity', 'acne'] },
  'coffee-shop': { types: ['oily', 'combination'], helpsConcerns: ['pores', 'oiliness'] },
  'office-polish': { types: ['normal', 'combination'], helpsConcerns: ['darkCircles', 'pores'] },
  'crimson-statement': { types: ['oily', 'combination', 'normal'], emphasisesConcerns: ['acne', 'redness'] },
  'midnight-wing': { types: ['oily', 'combination'], emphasisesConcerns: ['darkCircles'] },
  'berry-bomb': { types: ['normal', 'oily'], helpsConcerns: ['darkCircles'] },
};

export interface RankedLook extends MakeupLook {
  /** 0..100 — internal relevance score, exposed so the UI can label match strength. */
  matchScore: number;
}

function scoreLook(look: MakeupLook, profile: SkinProfile | null): number {
  if (!profile) return 50;
  const aff = AFFINITY[look.id];
  if (!aff) return 50;
  let s = 50;
  if (aff.types?.includes(profile.type)) s += 18;
  for (const c of aff.helpsConcerns ?? []) {
    const sev = profile.concerns[c] ?? 0;
    if (sev >= 2) s += 12;
    else if (sev >= 1) s += 6;
  }
  for (const c of aff.emphasisesConcerns ?? []) {
    const sev = profile.concerns[c] ?? 0;
    if (sev >= 3) s -= 18;
    else if (sev >= 2) s -= 10;
    else if (sev >= 1) s -= 4;
  }
  return Math.max(0, Math.min(100, s));
}

/**
 * Reorders looks within each section by relevance to the profile. Sections
 * themselves keep their canonical order (Editorial / Bridal / Everyday / Bold)
 * so the catalog stays predictable, but the strongest match within each
 * section bubbles up.
 */
export function rankSectionsForProfile(profile: SkinProfile | null): LookSection[] {
  return LOOK_SECTIONS.map((section) => ({
    ...section,
    looks: [...section.looks]
      .map((l) => ({ look: l, score: scoreLook(l, profile) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.look),
  }));
}

/** Top-N looks across all sections, sorted by relevance. For the home zone preview. */
export function topLooksForProfile(profile: SkinProfile | null, n = 4): RankedLook[] {
  const flat = LOOK_SECTIONS.flatMap((s) => s.looks).map((l) => ({
    ...l,
    matchScore: scoreLook(l, profile),
  }));
  return flat.sort((a, b) => b.matchScore - a.matchScore).slice(0, n);
}

export function matchLabelForScore(s: number): string {
  if (s >= 75) return 'Strong match';
  if (s >= 60) return 'Good match';
  if (s >= 45) return 'Worth a try';
  return 'A bolder pick';
}
