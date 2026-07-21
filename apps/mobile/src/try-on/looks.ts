/**
 * Curated makeup look catalog. Each look is a "color story" of three shades —
 * lip, cheek, eye — plus a finish modifier. Looks are grouped by section
 * (Editorial, Bridal, Everyday, Bold) so the catalog reads like a magazine
 * edit rather than a flat list.
 *
 * The same shade trio drives both the look thumbnail (in the carousel) and the
 * face preview (as alpha-modulated colored overlays). When we wire up the
 * backend ML model, this same structure feeds the prompt: section + shade
 * trio + finish + per-zone intensity → AI-applied selfie.
 */

export type LookFinish = 'matte' | 'satin' | 'glow';

export interface MakeupLook {
  id: string;
  name: string;
  caption: string;
  finish: LookFinish;
  /** Dominant shades for the three primary makeup zones. */
  shades: {
    lip: string;
    cheek: string;
    eye: string;
  };
}

export interface LookSection {
  id: string;
  title: string;
  subtitle: string;
  looks: MakeupLook[];
}

export const LOOK_SECTIONS: LookSection[] = [
  {
    id: 'editorial',
    title: 'Editorial',
    subtitle: 'Magazine-cover finishes',
    looks: [
      {
        id: 'bronze-couture',
        name: 'Bronze Couture',
        caption: 'Warm contour, glazed lip',
        finish: 'glow',
        shades: { lip: '#A85B3A', cheek: '#B96A4E', eye: '#7C4B2A' },
      },
      {
        id: 'liquid-gold',
        name: 'Liquid Gold',
        caption: 'Gilded lid, nude lip',
        finish: 'glow',
        shades: { lip: '#C9876A', cheek: '#D89570', eye: '#C99A3A' },
      },
      {
        id: 'smoke-mirrors',
        name: 'Smoke & Mirrors',
        caption: 'Charcoal smoke, neutral mouth',
        finish: 'matte',
        shades: { lip: '#9C6450', cheek: '#A77762', eye: '#3D3530' },
      },
      {
        id: 'velvet-plum',
        name: 'Velvet Plum',
        caption: 'Deep plum lip, satin lid',
        finish: 'satin',
        shades: { lip: '#6F2840', cheek: '#A35C68', eye: '#5A3A4A' },
      },
    ],
  },
  {
    id: 'bridal',
    title: 'Bridal',
    subtitle: 'Romantic, luminous, all-day',
    looks: [
      {
        id: 'rose-veil',
        name: 'Rose Veil',
        caption: 'Soft rose halo',
        finish: 'satin',
        shades: { lip: '#C77074', cheek: '#E0A0A4', eye: '#B58C8E' },
      },
      {
        id: 'champagne-glow',
        name: 'Champagne Glow',
        caption: 'Pearl shimmer, peach lip',
        finish: 'glow',
        shades: { lip: '#D89478', cheek: '#EBB89C', eye: '#D9B984' },
      },
      {
        id: 'soft-sculpt',
        name: 'Soft Sculpt',
        caption: 'Subtle contour, nude rose',
        finish: 'satin',
        shades: { lip: '#B97A6E', cheek: '#C68B80', eye: '#A88474' },
      },
      {
        id: 'pearl-lustre',
        name: 'Pearl Lustre',
        caption: 'Iridescent lid, mauve lip',
        finish: 'glow',
        shades: { lip: '#B0717C', cheek: '#D29DA6', eye: '#C7B9C2' },
      },
    ],
  },
  {
    id: 'everyday',
    title: 'Everyday',
    subtitle: 'Polished, low-effort, your skin only better',
    looks: [
      {
        id: 'bare-plus',
        name: 'Bare+',
        caption: 'Tinted balm, fresh cheek',
        finish: 'satin',
        shades: { lip: '#C58177', cheek: '#D9988E', eye: '#B59586' },
      },
      {
        id: 'coffee-shop',
        name: 'Coffee Shop',
        caption: 'Cocoa lip, soft warmth',
        finish: 'matte',
        shades: { lip: '#8E5340', cheek: '#A37665', eye: '#6F4C3A' },
      },
      {
        id: 'office-polish',
        name: 'Office Polish',
        caption: 'Mauve lip, defined brow',
        finish: 'satin',
        shades: { lip: '#A06A6E', cheek: '#BD8689', eye: '#80645E' },
      },
    ],
  },
  {
    id: 'bold',
    title: 'Bold',
    subtitle: 'Statement looks for night',
    looks: [
      {
        id: 'crimson-statement',
        name: 'Crimson Statement',
        caption: 'Red lip, clean lid',
        finish: 'matte',
        shades: { lip: '#9C2A2A', cheek: '#B05A52', eye: '#5C4036' },
      },
      {
        id: 'midnight-wing',
        name: 'Midnight Wing',
        caption: 'Liner wing, mauve lip',
        finish: 'matte',
        shades: { lip: '#7F4F58', cheek: '#9E6D70', eye: '#161616' },
      },
      {
        id: 'berry-bomb',
        name: 'Berry Bomb',
        caption: 'Berry stain, bronzed lid',
        finish: 'satin',
        shades: { lip: '#6B2638', cheek: '#A65265', eye: '#7A4534' },
      },
    ],
  },
];

export const DEFAULT_LOOK_ID = LOOK_SECTIONS[0]!.looks[0]!.id;

export function findLook(id: string): MakeupLook | undefined {
  for (const section of LOOK_SECTIONS) {
    const found = section.looks.find((l) => l.id === id);
    if (found) return found;
  }
  return undefined;
}
