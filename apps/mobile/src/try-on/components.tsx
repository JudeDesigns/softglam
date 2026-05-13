import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Card, Row, Stack, Text } from '@softglow/ui';

interface Look {
  id: string;
  name: string;
  caption: string;
  accent: string;
}

interface LookTileProps {
  look: Look;
  selected: boolean;
  onPress: () => void;
}

export function LookTile({ look, selected, onPress }: LookTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 112,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing[3],
        backgroundColor: selected ? tokens.colors.text.primary : tokens.colors.surface.solid,
        borderWidth: 1,
        borderColor: selected ? tokens.colors.text.primary : tokens.colors.border.subtle,
        opacity: pressed ? 0.9 : 1,
        gap: tokens.spacing[2],
        ...tokens.shadow.sm,
      })}
    >
      <View
        style={{
          height: 64,
          borderRadius: tokens.radii.md,
          backgroundColor: look.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.35)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.45)',
          }}
        />
      </View>
      <Text
        variant="bodySm"
        weight="semibold"
        numberOfLines={1}
        tone={selected ? 'onHero' : 'primary'}
      >
        {look.name}
      </Text>
      <Text
        variant="caption"
        numberOfLines={1}
        tone={selected ? 'onHero' : 'tertiary'}
        style={selected ? { opacity: 0.75 } : undefined}
      >
        {look.caption}
      </Text>
    </Pressable>
  );
}

interface IntensityRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  onChange: (v: number) => void;
}

const LEVELS = ['Subtle', 'Medium', 'Bold'] as const;

export function IntensityRow({ icon, label, value, onChange }: IntensityRowProps) {
  return (
    <Card padding={tokens.spacing[4]} elevation="sm">
      <Row align="center" gap={tokens.spacing[3]}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: tokens.colors.background.sunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={tokens.colors.text.primary} />
        </View>
        <Stack gap={tokens.spacing[2]} style={{ flex: 1 }}>
          <Text variant="bodySm" weight="semibold">{label}</Text>
          <Row gap={tokens.spacing[2]}>
            {LEVELS.map((lvl, i) => {
              const selected = value === i;
              return (
                <Pressable
                  key={lvl}
                  onPress={() => onChange(i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: tokens.spacing[2],
                    borderRadius: tokens.radii.pill,
                    backgroundColor: selected ? tokens.colors.text.primary : 'transparent',
                    borderWidth: 1,
                    borderColor: selected ? tokens.colors.text.primary : tokens.colors.border.default,
                    alignItems: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    variant="caption"
                    weight="medium"
                    tone={selected ? 'onHero' : 'secondary'}
                  >
                    {lvl}
                  </Text>
                </Pressable>
              );
            })}
          </Row>
        </Stack>
      </Row>
    </Card>
  );
}
