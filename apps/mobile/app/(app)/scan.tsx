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
  IconButton,
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

  const topConcern = useMemo<{ concern: SkinConcern; n: number } | null>(() => {
    const counts = new Map<SkinConcern, number>();
    for (const t of tags) for (const c of t.concerns) counts.set(c, (counts.get(c) ?? 0) + 1);
    let best: { concern: SkinConcern; n: number } | null = null;
    counts.forEach((n, concern) => {
      if (best === null || n > best.n) best = { concern, n };
    });
    return best;
  }, [tags]);

  return (
    <Screen>
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <Stack gap={4}>
          <Text variant="caption" tone="tertiary" weight="medium">SMART RETICLE</Text>
          <Text variant="titleSm">Tag your face</Text>
        </Stack>
        <IconButton
          icon={<Ionicons name="camera-outline" size={20} color={tokens.colors.text.primary} />}
          accessibilityLabel="AI snap"
        />
      </Row>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use AI snap to auto-tag from a selfie"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.spacing[3],
          padding: tokens.spacing[4],
          borderRadius: tokens.radii.lg,
          backgroundColor: tokens.colors.accent.primarySoft,
          borderWidth: 1,
          borderColor: 'rgba(212, 175, 55, 0.30)',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(212, 175, 55, 0.22)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={18} color={tokens.colors.accent.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="tertiary" weight="medium">AI ASSIST · BETA</Text>
          <Text variant="bodySm" weight="semibold" style={{ marginTop: 2 }}>
            Auto-tag from a selfie
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.colors.text.primary} />
      </Pressable>

      <Card padding={tokens.spacing[4]} elevation="sm" style={{ marginTop: tokens.spacing[5] }}>
        <Stack gap={tokens.spacing[2]} style={{ marginBottom: tokens.spacing[3] }}>
          <Badge label="Tap exactly where it sits" tone="accent" />
          <Text variant="caption" tone="tertiary">
            Drop a tag on the spot — forehead, cheek, jaw — and tell us what's happening there.
          </Text>
        </Stack>
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

      {tags.length > 0 ? (
        <Card padding={tokens.spacing[4]} elevation="sm" style={{ marginTop: tokens.spacing[4] }}>
          <Row gap={tokens.spacing[5]} align="center">
            <SummaryStat label="Tags" value={String(tags.length)} />
            <View style={{ width: 1, height: 32, backgroundColor: tokens.colors.border.subtle }} />
            <SummaryStat label="Zones" value={String(grouped.length)} />
            <View style={{ width: 1, height: 32, backgroundColor: tokens.colors.border.subtle }} />
            <SummaryStat
              label="Top concern"
              value={topConcern ? CONCERN_LABELS[topConcern.concern] : '—'}
            />
          </Row>
        </Card>
      ) : null}

      <View style={{ marginTop: tokens.spacing[6] }}>
        <SectionHeader title="Tagged zones" caption="Tap a row to edit or remove" />
        {grouped.length === 0 ? (
          <Card padding={tokens.spacing[5]} elevation="sm">
            <Stack align="center" gap={tokens.spacing[2]}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: tokens.colors.background.sunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="locate-outline" size={22} color={tokens.colors.text.tertiary} />
              </View>
              <Text variant="bodySm" tone="secondary" align="center">
                No tags yet. Add one to refine your Skin Health Score.
              </Text>
            </Stack>
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" tone="tertiary" weight="medium" numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      <Text variant="bodySm" weight="semibold" numberOfLines={1} style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

