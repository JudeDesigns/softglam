import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import {
  Chip,
  IconButton,
  ProductCard,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
} from '@softglow/ui';

import { PRODUCT_CATALOG, type ProductMock } from '@/data/products';

interface Category {
  id: string;
  label: string;
  match?: (p: ProductMock) => boolean;
}

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All' },
  { id: 'serum', label: 'Serums', match: (p) => /serum/i.test(p.name) },
  { id: 'cream', label: 'Creams', match: (p) => /cream|lotion|mask/i.test(p.name) },
  { id: 'eye', label: 'Eye care', match: (p) => /eye/i.test(p.name) },
  { id: 'spf', label: 'SPF', match: (p) => /spf/i.test(p.name) },
];

export default function Shop() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  const filtered = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    const q = query.trim().toLowerCase();
    return PRODUCT_CATALOG.filter((p) => {
      if (cat?.match && !cat.match(p)) return false;
      if (!q) return true;
      return `${p.name} ${p.brand}`.toLowerCase().includes(q);
    });
  }, [query, categoryId]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <Screen>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <Stack gap={2}>
          <Text variant="caption" tone="tertiary" weight="medium">CURATED EDIT</Text>
          <Text variant="titleSm">Shop</Text>
        </Stack>
        <IconButton
          icon={<Ionicons name="bag-outline" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="Bag"
        />
      </Row>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.spacing[2],
          paddingHorizontal: tokens.spacing[4],
          height: 48,
          borderRadius: tokens.radii.pill,
          backgroundColor: tokens.colors.background.sunken,
          borderWidth: 1,
          borderColor: tokens.colors.border.subtle,
        }}
      >
        <Ionicons name="search-outline" size={18} color={tokens.colors.text.tertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products or brands"
          placeholderTextColor={tokens.colors.text.tertiary}
          style={{
            flex: 1,
            fontFamily: tokens.fontFamily.sans,
            fontSize: tokens.fontSize.base,
            color: tokens.colors.text.primary,
            paddingVertical: 0,
          }}
          returnKeyType="search"
        />
      </View>

      <View style={{ marginTop: tokens.spacing[4] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row gap={tokens.spacing[2]} style={{ paddingRight: tokens.spacing[4] }}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={c.id === categoryId}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </Row>
        </ScrollView>
      </View>

      {featured ? (
        <View style={{ marginTop: tokens.spacing[6] }}>
          <SectionHeader title="Editor's pick" caption="Hand-selected this week" />
          <ProductCard
            name={featured.name}
            brand={featured.brand}
            price={featured.price}
            badge={featured.badge}
            width={320}
            onPress={() => {}}
          />
        </View>
      ) : null}

      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader
          title="All products"
          caption={`${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
        />
        {rest.length === 0 ? (
          <Text variant="bodySm" tone="secondary">
            Nothing matches that filter yet.
          </Text>
        ) : (
          <Row gap={tokens.spacing[3]} wrap>
            {rest.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                brand={p.brand}
                price={p.price}
                badge={p.badge}
                width={160}
                onPress={() => {}}
              />
            ))}
          </Row>
        )}
      </View>
    </Screen>
  );
}
