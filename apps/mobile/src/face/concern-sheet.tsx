import { Modal, Pressable, View } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Button, Chip, Row, Stack, Text } from '@softglow/ui';
import {
  CONCERN_LABELS,
  SKIN_CONCERNS,
  type SkinConcern,
} from '@softglow/types';

interface ConcernSheetProps {
  visible: boolean;
  zoneLabel: string;
  selectedConcerns: SkinConcern[];
  onToggle: (concern: SkinConcern) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

/**
 * Bottom-attached modal where the user picks the concerns sitting at the
 * tapped face zone. Avoids a third-party bottom-sheet library — the built-in
 * Modal + slide animation is enough for the depth of interaction here.
 */
export function ConcernSheet({
  visible,
  zoneLabel,
  selectedConcerns,
  onToggle,
  onSave,
  onCancel,
  onDelete,
}: ConcernSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(15, 17, 21, 0.42)' }}
        onPress={onCancel}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: tokens.colors.background.raised,
          borderTopLeftRadius: tokens.radii['2xl'],
          borderTopRightRadius: tokens.radii['2xl'],
          padding: tokens.spacing[6],
          paddingBottom: tokens.spacing[10],
          gap: tokens.spacing[5],
          ...tokens.shadow.lg,
        }}
      >
        <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: tokens.colors.border.default }} />

        <Stack gap={tokens.spacing[1]}>
          <Text variant="label" tone="tertiary">{zoneLabel}</Text>
          <Text variant="titleSm">What&apos;s happening here?</Text>
          <Text variant="bodySm" tone="secondary">
            Pick everything that applies. You can update or remove this tag later.
          </Text>
        </Stack>

        <Row gap={tokens.spacing[2]} wrap>
          {SKIN_CONCERNS.map((c) => (
            <Chip
              key={c}
              label={CONCERN_LABELS[c]}
              selected={selectedConcerns.includes(c)}
              onPress={() => onToggle(c)}
            />
          ))}
        </Row>

        <Row gap={tokens.spacing[3]}>
          {onDelete ? (
            <Button label="Remove" variant="ghost" onPress={onDelete} />
          ) : (
            <Button label="Cancel" variant="ghost" onPress={onCancel} />
          )}
          <View style={{ flex: 1 }}>
            <Button
              label="Save tag"
              variant="primary"
              fullWidth
              disabled={selectedConcerns.length === 0}
              onPress={onSave}
            />
          </View>
        </Row>
      </View>
    </Modal>
  );
}
