import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import {
  Badge,
  Button,
  Card,
  FacePin,
  FacePortrait,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
  ZONE_LABELS,
  classifyZone,
  type FaceZoneName,
} from '@softglow/ui';
import { CONCERN_LABELS, type FaceZoneTag, type SkinConcern } from '@softglow/types';

import { useSkinProfile } from '@/state/skin-profile';
import { ConcernSheet } from '@/face/concern-sheet';

interface PendingTag {
  id: string;
  x: number;
  y: number;
  concerns: SkinConcern[];
  isNew: boolean;
}

function newTagId(): string {
  return `tag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function Scan() {
  const tags = useSkinProfile((s) => s.draft.zoneTags);
  const addZoneTag = useSkinProfile((s) => s.addZoneTag);
  const updateZoneTag = useSkinProfile((s) => s.updateZoneTag);
  const removeZoneTag = useSkinProfile((s) => s.removeZoneTag);

  const [pending, setPending] = useState<PendingTag | null>(null);

  const grouped = useMemo(() => {
    const byZone = new Map<FaceZoneName, FaceZoneTag[]>();
    for (const tag of tags) {
      const zone = classifyZone(tag.x, tag.y);
      const list = byZone.get(zone) ?? [];
      list.push(tag);
      byZone.set(zone, list);
    }
    return Array.from(byZone.entries());
  }, [tags]);

  const handleTapFace = (x: number, y: number) => {
    setPending({ id: newTagId(), x, y, concerns: [], isNew: true });
  };

  const handleEditPin = (tag: FaceZoneTag) => {
    setPending({ id: tag.id, x: tag.x, y: tag.y, concerns: [...tag.concerns], isNew: false });
  };

  const toggleConcern = (concern: SkinConcern) => {
    if (!pending) return;
    setPending({
      ...pending,
      concerns: pending.concerns.includes(concern)
        ? pending.concerns.filter((c) => c !== concern)
        : [...pending.concerns, concern],
    });
  };

  const handleSave = () => {
    if (!pending) return;
    if (pending.isNew) {
      addZoneTag({ id: pending.id, x: pending.x, y: pending.y, concerns: pending.concerns });
    } else {
      updateZoneTag(pending.id, pending.concerns);
    }
    setPending(null);
  };

  const handleDelete = () => {
    if (!pending) return;
    if (!pending.isNew) removeZoneTag(pending.id);
    setPending(null);
  };

  return (
    <Screen>
      <Stack gap={tokens.spacing[2]} style={{ marginBottom: tokens.spacing[5] }}>
        <Badge label="Smart Reticle" tone="accent" />
        <Text variant="titleSm">Tap exactly where it sits</Text>
        <Text variant="bodySm" tone="secondary">
          Drop a tag on the spot — forehead, cheek, jaw — and tell SoftGlow what&apos;s happening there.
        </Text>
      </Stack>

      <Card padding={tokens.spacing[4]} elevation="sm">
        <FacePortrait width={260} onTap={handleTapFace}>
          {tags.map((tag) => (
            <FacePin
              key={tag.id}
              x={tag.x}
              y={tag.y}
              count={tag.concerns.length}
              tone={tag.concerns.length >= 3 ? 'danger' : tag.concerns.length === 2 ? 'warning' : 'accent'}
              selected={pending?.id === tag.id}
              onPress={() => handleEditPin(tag)}
            />
          ))}
          {pending?.isNew ? (
            <FacePin x={pending.x} y={pending.y} tone="neutral" selected />
          ) : null}
        </FacePortrait>
        <Text variant="caption" tone="tertiary" align="center" style={{ marginTop: tokens.spacing[3] }}>
          {tags.length === 0 ? 'Tap the face to add your first tag' : `${tags.length} tag${tags.length === 1 ? '' : 's'} placed`}
        </Text>
      </Card>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader title="Tagged zones" caption="Tap a row to edit or remove" />
        {grouped.length === 0 ? (
          <Card padding={tokens.spacing[5]} elevation="sm">
            <Text variant="bodySm" tone="secondary">
              No tags yet. Add one to refine your Skin Health Score.
            </Text>
          </Card>
        ) : (
          <Stack gap={tokens.spacing[3]}>
            {grouped.map(([zone, zoneTags]) => (
              <Card key={zone} padding={tokens.spacing[4]} elevation="sm">
                <Text variant="label" tone="tertiary" weight="semibold" style={{ marginBottom: tokens.spacing[2] }}>
                  {ZONE_LABELS[zone]}
                </Text>
                <Stack gap={tokens.spacing[2]}>
                  {zoneTags.map((tag) => (
                    <Pressable
                      key={tag.id}
                      onPress={() => handleEditPin(tag)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: tokens.spacing[2],
                      }}
                    >
                      <Text variant="bodySm" style={{ flex: 1 }}>
                        {tag.concerns.map((c) => CONCERN_LABELS[c]).join(' · ')}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={tokens.colors.text.tertiary} />
                    </Pressable>
                  ))}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </View>

      {tags.length > 0 ? (
        <View style={{ marginTop: tokens.spacing[6] }}>
          <Button label="Done tagging" variant="secondary" fullWidth onPress={() => setPending(null)} />
        </View>
      ) : null}

      <ConcernSheet
        visible={pending !== null}
        zoneLabel={pending ? ZONE_LABELS[classifyZone(pending.x, pending.y)] : ''}
        selectedConcerns={pending?.concerns ?? []}
        onToggle={toggleConcern}
        onSave={handleSave}
        onCancel={() => setPending(null)}
        onDelete={pending && !pending.isNew ? handleDelete : undefined}
      />
    </Screen>
  );
}
