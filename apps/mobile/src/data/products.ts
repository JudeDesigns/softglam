import type { SkinConcern } from '@softglow/types';

export interface ProductMock {
  id: string;
  name: string;
  brand: string;
  price: string;
  /** Concerns this product targets, used for personalized ranking. */
  targets: SkinConcern[];
  badge?: { label: string; tone?: 'accent' | 'success' | 'warning' | 'info' };
}

/**
 * Stand-in catalog for the home carousel. Replaced by a real product API in
 * phase 2; the shape is already API-ish so the swap is trivial.
 */
export const PRODUCT_CATALOG: ProductMock[] = [
  {
    id: 'p1',
    name: 'Calm Barrier Cream',
    brand: 'Vellum',
    price: '$38.00',
    targets: ['redness', 'sensitivity', 'dryness'],
    badge: { label: 'Best for you', tone: 'accent' },
  },
  {
    id: 'p2',
    name: 'Hydrating Niacinamide Serum 5%',
    brand: 'Lumen Labs',
    price: '$28.00',
    targets: ['pores', 'oiliness'],
  },
  {
    id: 'p3',
    name: 'Overnight Retexture Mask',
    brand: 'Bloom',
    price: '$42.00',
    targets: ['acne', 'pores'],
    badge: { label: 'New', tone: 'success' },
  },
  {
    id: 'p4',
    name: 'Brightening Eye Salve',
    brand: 'Vellum',
    price: '$32.00',
    targets: ['darkCircles'],
  },
  {
    id: 'p5',
    name: 'Ceramide Replenishing Lotion',
    brand: 'Aura',
    price: '$24.00',
    targets: ['dryness'],
  },
  {
    id: 'p6',
    name: 'Mattifying Daily SPF 40',
    brand: 'Lumen Labs',
    price: '$30.00',
    targets: ['oiliness', 'redness'],
  },
];

/**
 * Rank products by how well their `targets` match the user's top concerns.
 * Falls back to original order when no concerns are present.
 */
export function rankProducts(
  catalog: ProductMock[],
  topConcerns: SkinConcern[],
): ProductMock[] {
  if (topConcerns.length === 0) return catalog;
  const weight = new Map(topConcerns.map((c, i) => [c, topConcerns.length - i]));
  return [...catalog].sort((a, b) => {
    const score = (p: ProductMock) =>
      p.targets.reduce((acc, t) => acc + (weight.get(t) ?? 0), 0);
    return score(b) - score(a);
  });
}
