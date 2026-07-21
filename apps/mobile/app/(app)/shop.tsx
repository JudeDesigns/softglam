import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { IconButton, Row, Screen, Stack } from '@softglow/ui';

import { useProducts } from '@/state/products';
import type { ApiProduct } from '@/api/types';

// ─── Design tokens (The Vanity — Shop edition) ───────────────────────────────
const C = {
  bg:           '#FDFAF6',
  card:         '#FAF6F1',
  cardBorder:   '#E4D9CD',
  inputBg:      '#F3EBE0',
  textPrimary:  '#2B211D',
  textSecondary:'#9A8070',
  textMuted:    '#BDA898',
  roseClay:     '#C97B6A',  // primary accent — Add to bag, active filters
  champagne:    '#E8C79A',  // secondary accent — featured badge, price highlight
  champagneBg:  '#FAF0E0',  // spotlight card tint
  divider:      '#E4D9CD',
  white:        '#FFFFFF',
} as const;

// ─── Data ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  label: string;
  match?: (p: ApiProduct) => boolean;
}

const CATEGORIES: Category[] = [
  { id: 'all',   label: 'All' },
  { id: 'serum', label: 'Serums',   match: (p) => /serum/i.test(p.name) },
  { id: 'cream', label: 'Creams',   match: (p) => /cream|lotion|mask/i.test(p.name) },
  { id: 'eye',   label: 'Eye care', match: (p) => /eye/i.test(p.name) },
  { id: 'spf',   label: 'SPF',      match: (p) => /spf/i.test(p.name) },
];

interface Capsule {
  id: string;
  kicker: string;
  title: string;
  caption: string;
  steps: number;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CAPSULES: Capsule[] = [
  { id: 'am',   kicker: 'AM RITUAL', title: 'Morning Glow',    caption: '3-step calming routine', steps: 3, tint: '#F5EBC2', icon: 'sunny-outline'  },
  { id: 'pm',   kicker: 'PM RITUAL', title: 'Overnight Reset', caption: '4-step repair capsule',  steps: 4, tint: '#E7E5E4', icon: 'moon-outline'   },
  { id: 'spot', kicker: 'TARGETED',  title: 'Clear & Calm',    caption: '3-step blemish capsule', steps: 3, tint: '#EBD58A', icon: 'leaf-outline'   },
];

function healthBadge(score: number): string | undefined {
  if (score >= 80) return score >= 90 ? 'Clean 90+' : `Health ${score}`;
  return undefined;
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function Shop() {
  const [query,      setQuery]      = useState('');
  const [categoryId, setCategoryId] = useState('all');

  const products  = useProducts((s) => s.products);
  const isLoading = useProducts((s) => s.isLoading);
  const error     = useProducts((s) => s.error);
  const fetch     = useProducts((s) => s.fetch);

  useEffect(() => { void fetch(); }, [fetch]);

  const rowGap = tokens.spacing[4];

  const filtered = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (cat?.match && !cat.match(p)) return false;
      if (!q) return true;
      return `${p.name} ${p.brand}`.toLowerCase().includes(q);
    });
  }, [query, categoryId, products]);

  const spotlight = filtered[0];
  const loved     = filtered.slice(1, 5);

  return (
    <Screen style={{ backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <Stack gap={4}>
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sans,
              fontSize: tokens.fontSize.xs,
              letterSpacing: tokens.letterSpacing.wider,
              color: C.textMuted,
            }}
          >
            CURATED EDIT
          </RNText>
          {/* Page title — only serif element on this screen */}
          <RNText
            style={{
              fontFamily: 'PlayfairDisplay_600SemiBold',
              fontSize: 28,
              color: C.textPrimary,
              lineHeight: 34,
            }}
          >
            Shop
          </RNText>
        </Stack>
        <IconButton
          icon={<Ionicons name="bag-outline" size={20} color={C.textPrimary} />}
          accessibilityLabel="Bag"
        />
      </Row>

      {/* ── Search bar ── */}
      <SearchBar value={query} onChangeText={setQuery} />

      {/* ── Category filters ── */}
      <View style={{ marginTop: tokens.spacing[4] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row gap={tokens.spacing[2]} style={{ paddingRight: tokens.spacing[4] }}>
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                label={c.label}
                active={c.id === categoryId}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </Row>
        </ScrollView>
      </View>

      {/* ── Async states ── */}
      {isLoading ? (
        <View style={{ marginTop: tokens.spacing[12], alignItems: 'center' }}>
          <ActivityIndicator color={C.roseClay} />
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sans,
              fontSize: tokens.fontSize.sm,
              color: C.textSecondary,
              marginTop: tokens.spacing[3],
            }}
          >
            Loading products…
          </RNText>
        </View>
      ) : error ? (
        <Pressable
          onPress={() => fetch(undefined, true)}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          style={({ pressed }) => ({
            marginTop: tokens.spacing[8],
            padding: tokens.spacing[5],
            borderRadius: tokens.radii.lg,
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.cardBorder,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sans,
              fontSize: tokens.fontSize.sm,
              color: C.textSecondary,
            }}
          >
            Failed to load products. Tap to retry.
          </RNText>
        </Pressable>
      ) : (
        <>
          {/* ── Spotlight ── */}
          {spotlight ? <SpotlightCard product={spotlight} /> : null}

          {/* ── Curated capsules ── */}
          <View style={{ marginTop: tokens.spacing[8] }}>
            <SectionLead kicker="ROUTINES" title="Curated capsules" caption="3- to 4-step bundles, picked for your skin" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[5] }}>
                {CAPSULES.map((c) => <CapsuleCard key={c.id} capsule={c} />)}
              </Row>
            </ScrollView>
          </View>

          {/* ── Most loved ── */}
          {loved.length > 0 ? (
            <View style={{ marginTop: tokens.spacing[8] }}>
              <SectionLead kicker="MOST LOVED" title="This week's best" caption="What our community is reaching for" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[5] }}>
                  {loved.map((p) => (
                    <MiniProductCard key={p.id} product={p} />
                  ))}
                </Row>
              </ScrollView>
            </View>
          ) : null}

          {/* ── All products grid ── */}
          <View style={{ marginTop: tokens.spacing[8] }}>
            <SectionLead
              kicker="THE EDIT"
              title="All products"
              caption={`${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
            />
            {filtered.length === 0 ? (
              <RNText
                style={{
                  fontFamily: tokens.fontFamily.sans,
                  fontSize: tokens.fontSize.sm,
                  color: C.textSecondary,
                }}
              >
                Nothing matches that filter yet.
              </RNText>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: tokens.spacing[3] }}
                ItemSeparatorComponent={() => <View style={{ height: rowGap }} />}
                renderItem={({ item: p }) => (
                  <View style={{ flex: 1 }}>
                    <GridProductCard product={p} />
                  </View>
                )}
              />
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SearchBar({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing[2],
        paddingHorizontal: tokens.spacing[4],
        height: 48,
        borderRadius: tokens.radii.pill,
        backgroundColor: C.inputBg,
        borderWidth: 1,
        borderColor: C.cardBorder,
      }}
    >
      <Ionicons name="search-outline" size={18} color={C.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search products or brands"
        placeholderTextColor={C.textMuted}
        accessibilityLabel="Search products or brands"
        style={{
          flex: 1,
          fontFamily: tokens.fontFamily.sans,
          fontSize: tokens.fontSize.base,
          color: C.textPrimary,
          paddingVertical: 0,
        }}
        returnKeyType="search"
      />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => ({
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: tokens.spacing[2],
        borderRadius: tokens.radii.pill,
        backgroundColor: active ? C.roseClay : C.inputBg,
        borderWidth: 1,
        borderColor: active ? C.roseClay : C.cardBorder,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <RNText
        style={{
          fontFamily: tokens.fontFamily.sansMedium,
          fontSize: tokens.fontSize.xs,
          letterSpacing: tokens.letterSpacing.wide,
          color: active ? C.white : C.textSecondary,
        }}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

function SectionLead({ kicker, title, caption }: { kicker: string; title: string; caption?: string }) {
  return (
    <View style={{ marginBottom: tokens.spacing[4] }}>
      <RNText
        style={{
          fontFamily: tokens.fontFamily.sansMedium,
          fontSize: tokens.fontSize.xs,
          letterSpacing: tokens.letterSpacing.wider,
          color: C.textMuted,
          marginBottom: 4,
        }}
      >
        {kicker}
      </RNText>
      <RNText
        style={{
          fontFamily: tokens.fontFamily.sansSemibold,
          fontSize: tokens.fontSize.lg,
          color: C.textPrimary,
          lineHeight: tokens.lineHeight.lg,
        }}
      >
        {title}
      </RNText>
      {caption ? (
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sans,
            fontSize: tokens.fontSize.sm,
            color: C.textSecondary,
            marginTop: 2,
          }}
        >
          {caption}
        </RNText>
      ) : null}
    </View>
  );
}

/** Full-width featured product card with Champagne tint. */
function SpotlightCard({ product }: { product: ApiProduct }) {
  return (
    <View
      style={{
        marginTop: tokens.spacing[8],
        borderRadius: tokens.radii.lg,
        backgroundColor: C.champagneBg,
        borderWidth: 1,
        borderColor: C.cardBorder,
        padding: tokens.spacing[6],
        ...tokens.shadow.sm,
      }}
    >
      {/* Featured badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2], marginBottom: tokens.spacing[4] }}>
        <View
          style={{
            backgroundColor: C.champagne,
            paddingHorizontal: tokens.spacing[2],
            paddingVertical: 3,
            borderRadius: tokens.radii.xs,
          }}
        >
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sansMedium,
              fontSize: 10,
              letterSpacing: tokens.letterSpacing.wider,
              color: C.textPrimary,
            }}
          >
            EDITOR'S PICK
          </RNText>
        </View>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sans,
            fontSize: tokens.fontSize.xs,
            color: C.textMuted,
            letterSpacing: tokens.letterSpacing.wide,
          }}
        >
          WEEK 27
        </RNText>
      </View>

      {/* Product info */}
      <RNText
        style={{
          fontFamily: tokens.fontFamily.sansMedium,
          fontSize: tokens.fontSize.xs,
          letterSpacing: tokens.letterSpacing.wider,
          color: C.textSecondary,
          marginBottom: 4,
        }}
      >
        {product.brand.toUpperCase()}
      </RNText>
      <RNText
        style={{
          fontFamily: tokens.fontFamily.sansSemibold,
          fontSize: tokens.fontSize.xl,
          color: C.textPrimary,
          lineHeight: tokens.lineHeight.xl,
          marginBottom: tokens.spacing[2],
        }}
      >
        {product.name}
      </RNText>
      <RNText
        style={{
          fontFamily: tokens.fontFamily.sans,
          fontSize: tokens.fontSize.sm,
          color: C.textSecondary,
          lineHeight: tokens.lineHeight.sm,
          marginBottom: tokens.spacing[5],
        }}
      >
        A one-bottle ritual our editors keep coming back to — light on the skin, lush in feel.
      </RNText>

      {/* Price + CTA */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansSemibold,
            fontSize: tokens.fontSize['2xl'],
            color: C.textPrimary,
          }}
        >
          ${product.price.toFixed(2)}
        </RNText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to bag`}
          android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
          style={({ pressed }) => ({
            paddingHorizontal: tokens.spacing[5],
            paddingVertical: tokens.spacing[3],
            borderRadius: tokens.radii.lg,
            backgroundColor: C.roseClay,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sansSemibold,
              fontSize: tokens.fontSize.sm,
              color: C.white,
              letterSpacing: tokens.letterSpacing.wide,
            }}
          >
            Add to bag
          </RNText>
        </Pressable>
      </View>
    </View>
  );
}

/** Horizontal scroll card for the "Most Loved" row. */
function MiniProductCard({ product }: { product: ApiProduct }) {
  const badge = healthBadge(product.health_score);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name} by ${product.brand}, $${product.price.toFixed(2)}`}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => ({
        width: 172,
        borderRadius: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.cardBorder,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* Image placeholder */}
      <View
        style={{
          height: 120,
          backgroundColor: C.inputBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="sparkles-outline" size={28} color={C.textMuted} />
      </View>

      <View style={{ padding: tokens.spacing[3], gap: tokens.spacing[1] }}>
        {badge ? (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: C.champagne,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: tokens.radii.xs,
              marginBottom: 4,
            }}
          >
            <RNText
              style={{
                fontFamily: tokens.fontFamily.sansMedium,
                fontSize: 10,
                color: C.textPrimary,
                letterSpacing: tokens.letterSpacing.wide,
              }}
            >
              {badge}
            </RNText>
          </View>
        ) : null}

        <RNText
          style={{
            fontFamily: tokens.fontFamily.sans,
            fontSize: tokens.fontSize.xs,
            color: C.textSecondary,
            letterSpacing: tokens.letterSpacing.wide,
          }}
          numberOfLines={1}
        >
          {product.brand.toUpperCase()}
        </RNText>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansMedium,
            fontSize: tokens.fontSize.sm,
            color: C.textPrimary,
            lineHeight: tokens.lineHeight.sm,
          }}
          numberOfLines={2}
        >
          {product.name}
        </RNText>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansSemibold,
            fontSize: tokens.fontSize.sm,
            color: C.textPrimary,
            marginTop: 2,
          }}
        >
          ${product.price.toFixed(2)}
        </RNText>
      </View>
    </Pressable>
  );
}

/** Two-column grid product tile. */
function GridProductCard({ product }: { product: ApiProduct }) {
  const badge = healthBadge(product.health_score);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name} by ${product.brand}, $${product.price.toFixed(2)}`}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.cardBorder,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* Image placeholder */}
      <View
        style={{
          height: 110,
          backgroundColor: C.inputBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="sparkles-outline" size={24} color={C.textMuted} />
      </View>

      <View style={{ padding: tokens.spacing[3], gap: tokens.spacing[1] }}>
        {badge ? (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: C.champagne,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: tokens.radii.xs,
              marginBottom: 2,
            }}
          >
            <RNText
              style={{
                fontFamily: tokens.fontFamily.sansMedium,
                fontSize: 10,
                color: C.textPrimary,
                letterSpacing: tokens.letterSpacing.wide,
              }}
            >
              {badge}
            </RNText>
          </View>
        ) : null}

        <RNText
          style={{
            fontFamily: tokens.fontFamily.sans,
            fontSize: tokens.fontSize.xs,
            color: C.textSecondary,
            letterSpacing: tokens.letterSpacing.wide,
          }}
          numberOfLines={1}
        >
          {product.brand.toUpperCase()}
        </RNText>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansMedium,
            fontSize: tokens.fontSize.sm,
            color: C.textPrimary,
            lineHeight: tokens.lineHeight.sm,
          }}
          numberOfLines={2}
        >
          {product.name}
        </RNText>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansSemibold,
            fontSize: tokens.fontSize.sm,
            color: C.textPrimary,
            marginTop: 2,
          }}
        >
          ${product.price.toFixed(2)}
        </RNText>

        {/* Add to bag */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to bag`}
          android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
          style={({ pressed }) => ({
            marginTop: tokens.spacing[2],
            paddingVertical: tokens.spacing[2],
            borderRadius: tokens.radii.sm,
            backgroundColor: C.roseClay,
            alignItems: 'center',
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sansSemibold,
              fontSize: tokens.fontSize.xs,
              color: C.white,
              letterSpacing: tokens.letterSpacing.wide,
            }}
          >
            Add to bag
          </RNText>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Horizontal scroll card for curated capsule routines. */
function CapsuleCard({ capsule }: { capsule: Capsule }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${capsule.title} — ${capsule.caption}`}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => ({
        width: 220,
        padding: tokens.spacing[4],
        borderRadius: tokens.radii.lg,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.cardBorder,
        gap: tokens.spacing[3],
        opacity: pressed ? 0.92 : 1,
        ...tokens.shadow.sm,
      })}
    >
      {/* Icon swatch */}
      <View
        style={{
          height: 100,
          borderRadius: tokens.radii.md,
          backgroundColor: capsule.tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={capsule.icon} size={32} color={C.textPrimary} />
      </View>

      <View style={{ gap: tokens.spacing[1] }}>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansMedium,
            fontSize: tokens.fontSize.xs,
            letterSpacing: tokens.letterSpacing.wider,
            color: C.textMuted,
          }}
        >
          {capsule.kicker}
        </RNText>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sansSemibold,
            fontSize: tokens.fontSize.sm,
            color: C.textPrimary,
          }}
        >
          {capsule.title}
        </RNText>
        <RNText
          style={{
            fontFamily: tokens.fontFamily.sans,
            fontSize: tokens.fontSize.xs,
            color: C.textSecondary,
          }}
        >
          {capsule.caption}
        </RNText>
        {/* Steps badge */}
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            backgroundColor: C.inputBg,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: tokens.radii.pill,
            borderWidth: 1,
            borderColor: C.cardBorder,
          }}
        >
          <RNText
            style={{
              fontFamily: tokens.fontFamily.sansMedium,
              fontSize: 10,
              color: C.textSecondary,
              letterSpacing: tokens.letterSpacing.wide,
            }}
          >
            {capsule.steps} steps
          </RNText>
        </View>
      </View>
    </Pressable>
  );
}
