import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Pressable, Row, Text } from '@softglow/ui';

import { mediaUrl } from '@/api/client';
import { type LookDraft, useLookDrafts } from '@/state/look-drafts';
import { V } from './components';

/** Opens the screen a draft came from, with its photos, preview and settings restored. */
export function resumeDraft(draft: LookDraft) {
  if (draft.kind === 'library' && draft.lookId) {
    router.push({ pathname: '/(app)/look-share/[id]', params: { id: draft.lookId, draft: draft.id } });
  } else {
    router.push({ pathname: '/(app)/look-share/copy', params: { draft: draft.id } });
  }
}

export function draftStatus(draft: LookDraft): string {
  if (draft.previewUrl) return 'Preview ready · not sent';
  if (draft.kind === 'copy') {
    const n = draft.referenceUrls?.length ?? 0;
    return n > 0 ? `${n} inspiration photo${n === 1 ? '' : 's'} added` : 'Photos added';
  }
  return 'Photo added';
}

export function relativeTime(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

/** One unfinished look: thumbnail, title, where it got to, Continue, and delete. */
export function DraftRow({ draft, compact }: { draft: LookDraft; compact?: boolean }) {
  const remove = useLookDrafts((s) => s.remove);
  const thumb = draft.previewUrl ?? draft.selfieUrl ?? draft.referenceUrls?.[0];

  const onDelete = () =>
    Alert.alert('Delete this unfinished look?', 'Its photos and settings will be removed from My looks.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(draft.id) },
    ]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${draft.title}`}
      onPress={() => resumeDraft(draft)}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: V.cardBorder,
        backgroundColor: V.card,
        borderRadius: tokens.radii.xl,
        padding: tokens.spacing[3],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Row gap={tokens.spacing[3]} align="center">
        <View
          style={{
            width: compact ? 52 : 60,
            height: compact ? 64 : 76,
            borderRadius: tokens.radii.md,
            backgroundColor: V.sand,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {thumb ? (
            <Image source={{ uri: mediaUrl(thumb) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Ionicons name="image-outline" size={20} color={V.textSecondary} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="caption" weight="semibold" style={{ color: V.accent, letterSpacing: 0.4 }}>
            {draft.kind === 'library' ? 'FROM THE LIBRARY' : 'COPIED FROM PHOTOS'}
          </Text>
          <Text variant="bodySm" weight="semibold" numberOfLines={1} style={{ color: V.textPrimary }}>
            {draft.title}
          </Text>
          <Text variant="caption" numberOfLines={1} style={{ color: V.textSecondary }}>
            {draftStatus(draft)} · {relativeTime(draft.updatedAt)}
          </Text>
        </View>
        {!compact && (
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${draft.title}`} onPress={onDelete} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={18} color={V.textSecondary} />
          </Pressable>
        )}
        <Row gap={2} align="center">
          <Text variant="caption" weight="semibold" style={{ color: V.accent }}>Continue</Text>
          <Ionicons name="chevron-forward" size={14} color={V.accent} />
        </Row>
      </Row>
    </Pressable>
  );
}
