import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import {
  Button,
  Card,
  FacePortrait,
  IconButton,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
} from '@softglow/ui';
import { IntensityRow, LookTile } from '@/try-on/components';

interface Look {
  id: string;
  name: string;
  caption: string;
  accent: string;
}

const LOOKS: Look[] = [
  { id: 'natural', name: 'Natural Glow', caption: 'Sheer & dewy', accent: '#F5EBC2' },
  { id: 'editorial', name: 'Editorial', caption: 'Defined contour', accent: '#D4AF37' },
  { id: 'bridal', name: 'Bridal Soft', caption: 'Luminous veil', accent: '#EDE9E0' },
  { id: 'bold', name: 'Bold Statement', caption: 'High-impact', accent: '#A8423A' },
  { id: 'midnight', name: 'Midnight', caption: 'Smoky drama', accent: '#262626' },
];

type ParamKey = 'lip' | 'cheek' | 'eye' | 'brow';

const PARAMS: { key: ParamKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'lip', label: 'Lip', icon: 'water-outline' },
  { key: 'cheek', label: 'Cheek', icon: 'flower-outline' },
  { key: 'eye', label: 'Eye', icon: 'eye-outline' },
  { key: 'brow', label: 'Brow', icon: 'analytics-outline' },
];

export default function TryOn() {
  const [lookId, setLookId] = useState<string>('natural');
  const [intensities, setIntensities] = useState<Record<ParamKey, number>>({
    lip: 1,
    cheek: 1,
    eye: 1,
    brow: 1,
  });

  const activeLook = LOOKS.find((l) => l.id === lookId)!;

  return (
    <Screen padding={tokens.spacing[5]}>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[4] }}>
        <Stack gap={2}>
          <Text variant="caption" tone="tertiary" weight="medium">VIRTUAL TRY-ON</Text>
          <Text variant="titleSm">Studio</Text>
        </Stack>
        <Row gap={tokens.spacing[2]}>
          <IconButton
            icon={<Ionicons name="camera-outline" size={20} color={tokens.colors.text.primary} />}
            accessibilityLabel="Use live camera"
          />
          <IconButton
            icon={<Ionicons name="share-outline" size={20} color={tokens.colors.text.primary} />}
            accessibilityLabel="Share look"
          />
        </Row>
      </Row>

      <Card surface="hero" elevation="hero" borderless padding={tokens.spacing[5]}>
        <Stack align="center" gap={tokens.spacing[3]}>
          <Row gap={tokens.spacing[2]} align="center">
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: activeLook.accent,
              }}
            />
            <Text variant="label" tone="onHero" weight="medium">
              {activeLook.name.toUpperCase()}
            </Text>
          </Row>
          <View style={{ position: 'relative' }}>
            <FacePortrait width={240} />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 999,
                backgroundColor: activeLook.accent,
                opacity: 0.12,
              }}
            />
          </View>
          <Text variant="bodySm" tone="onHero" style={{ opacity: 0.8 }} align="center">
            {activeLook.caption}
          </Text>
        </Stack>
      </Card>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader title="Curated looks" caption="Tap to preview" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[4] }}>
            {LOOKS.map((l) => (
              <LookTile
                key={l.id}
                look={l}
                selected={l.id === lookId}
                onPress={() => setLookId(l.id)}
              />
            ))}
          </Row>
        </ScrollView>
      </View>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader title="Adjust" caption="Fine-tune each zone" />
        <Stack gap={tokens.spacing[3]}>
          {PARAMS.map((p) => (
            <IntensityRow
              key={p.key}
              icon={p.icon}
              label={p.label}
              value={intensities[p.key]}
              onChange={(v) => setIntensities((prev) => ({ ...prev, [p.key]: v }))}
            />
          ))}
        </Stack>
      </View>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Row gap={tokens.spacing[3]}>
          <Button label="Save look" variant="primary" fullWidth />
        </Row>
      </View>
    </Screen>
  );
}
