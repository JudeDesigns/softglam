import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import {
  Badge,
  Button,
  Card,
  IconButton,
  Row,
  Screen,
  Stack,
  Text,
} from '@softglow/ui';
import { IntensitySlider, MakeupPreview } from '@/try-on/components';
import { LOOK_SECTIONS, findLook } from '@/try-on/looks';

type SourceMode = 'silhouette' | 'photo' | 'camera';

interface Intensities { lip: number; cheek: number; eye: number; brow: number }
const DEFAULT_INTENSITIES: Intensities = { lip: 0.7, cheek: 0.55, eye: 0.6, brow: 0.4 };

export default function LookFineTune() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const look = useMemo(() => (id ? findLook(id) : undefined), [id]);
  const section = useMemo(
    () => LOOK_SECTIONS.find((s) => s.looks.some((l) => l.id === id)),
    [id],
  );

  const [intensities, setIntensities] = useState<Intensities>(DEFAULT_INTENSITIES);
  const [source, setSource] = useState<SourceMode>('silhouette');
  const update = (k: keyof Intensities, v: number) =>
    setIntensities((prev) => ({ ...prev, [k]: v }));

  if (!look || !section) {
    return (
      <Screen>
        <Text variant="heading">Look not found</Text>
        <View style={{ marginTop: tokens.spacing[4] }}>
          <Button label="Back to studio" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padding={tokens.spacing[5]}>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[4] }}>
        <IconButton
          icon={<Ionicons name="chevron-back" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="Back"
          onPress={() => router.back()}
        />
        <Stack gap={6} align="center">
          <Text variant="caption" tone="tertiary" weight="medium">STUDIO</Text>
          <Text variant="titleSm" numberOfLines={1}>{look.name}</Text>
        </Stack>
        <IconButton
          icon={<Ionicons name="share-outline" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="Share look"
        />
      </Row>

      <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[5]}>
        <Stack align="center" gap={tokens.spacing[3]}>
          <Row gap={tokens.spacing[2]} align="center">
            <Badge label={section.title} tone="accent" onHero />
            <Text variant="label" tone="onHero" weight="medium">{look.finish.toUpperCase()}</Text>
          </Row>
          <MakeupPreview width={220} look={look} intensities={intensities} />
          <Text variant="bodySm" tone="onHero" style={{ opacity: 0.78 }} align="center">
            {look.caption}
          </Text>
        </Stack>
      </Card>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Text variant="caption" tone="tertiary" weight="medium" style={{ marginBottom: tokens.spacing[2] }}>
          APPLY TO
        </Text>
        <Row gap={tokens.spacing[3]}>
          <SourceTile id="silhouette" icon="happy-outline" label="Preview" hint="Model face" active={source} onPress={setSource} />
          <SourceTile id="photo" icon="image-outline" label="Upload" hint="From library" active={source} onPress={setSource} />
          <SourceTile id="camera" icon="camera-outline" label="Camera" hint="Take selfie" active={source} onPress={setSource} />
        </Row>
      </View>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Text variant="heading">Adjust intensity</Text>
        <Text variant="bodySm" tone="secondary" style={{ marginTop: 2, marginBottom: tokens.spacing[4] }}>
          Drag each zone to dial the shade up or down
        </Text>
        <Stack gap={tokens.spacing[3]}>
          <IntensitySlider icon="water-outline" label="Lip" swatch={look.shades.lip} value={intensities.lip} onChange={(v) => update('lip', v)} />
          <IntensitySlider icon="flower-outline" label="Cheek" swatch={look.shades.cheek} value={intensities.cheek} onChange={(v) => update('cheek', v)} />
          <IntensitySlider icon="eye-outline" label="Eye" swatch={look.shades.eye} value={intensities.eye} onChange={(v) => update('eye', v)} />
          <IntensitySlider icon="analytics-outline" label="Brow" swatch={look.shades.eye} value={intensities.brow} onChange={(v) => update('brow', v)} />
        </Stack>
      </View>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Row gap={tokens.spacing[3]}>
          <Button label="Reset" variant="secondary" onPress={() => setIntensities(DEFAULT_INTENSITIES)} />
          <View style={{ flex: 1 }}>
            <Button label="Save look" variant="primary" fullWidth />
          </View>
        </Row>
      </View>
    </Screen>
  );
}

function SourceTile({
  id,
  icon,
  label,
  hint,
  active,
  onPress,
}: {
  id: SourceMode;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  active: SourceMode;
  onPress: (s: SourceMode) => void;
}) {
  const selected = active === id;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(id)}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: tokens.spacing[2],
        paddingVertical: tokens.spacing[4],
        paddingHorizontal: tokens.spacing[2],
        borderRadius: tokens.radii.lg,
        borderWidth: 1,
        borderColor: selected ? tokens.colors.text.primary : tokens.colors.border.subtle,
        backgroundColor: selected ? tokens.colors.text.primary : tokens.colors.surface.solid,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={selected ? tokens.colors.text.onHero : tokens.colors.text.primary} />
      <Text variant="caption" weight="semibold" tone={selected ? 'onHero' : 'primary'} numberOfLines={1}>{label}</Text>
      <Text variant="caption" tone={selected ? 'onHero' : 'tertiary'} numberOfLines={1} style={selected ? { opacity: 0.7 } : undefined}>{hint}</Text>
    </Pressable>
  );
}
