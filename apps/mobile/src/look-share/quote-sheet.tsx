import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import { Button, Row, Stack, Text } from '@softglow/ui';

import { CURRENCY_SYMBOL, formatDay, formatMoney, formatTime, parseMoney } from '@/lib/format';
import type { QuoteInput } from '@/state/look-requests';
import { V } from './components';

const DAYS_AHEAD = 21;
const FIRST_HOUR = 6;
const LAST_HOUR = 20;

function upcomingDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

/** Half-hour slots, as minutes after midnight. */
const SLOTS = Array.from(
  { length: (LAST_HOUR - FIRST_HOUR) * 2 + 1 },
  (_, i) => FIRST_HOUR * 60 + i * 30,
);

function atSlot(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/**
 * Full-screen sheet where the artist sets price, day/time and a note. The
 * client can book only a quote with a proposed time, so all three are needed.
 */
export function QuoteSheet({
  visible,
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  initial?: { quotedPrice?: number; proposedAt?: string; quote?: string };
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: QuoteInput) => void;
}) {
  const insets = useSafeAreaInsets();
  const days = useMemo(upcomingDays, [visible]);
  const initialDate = initial?.proposedAt ? new Date(initial.proposedAt) : null;

  const [priceText, setPriceText] = useState(initial?.quotedPrice ? String(initial.quotedPrice) : '');
  const [dayIndex, setDayIndex] = useState<number | null>(() => {
    if (!initialDate) return null;
    const i = days.findIndex((d) => d.toDateString() === initialDate.toDateString());
    return i >= 0 ? i : null;
  });
  const [slot, setSlot] = useState<number | null>(
    initialDate ? initialDate.getHours() * 60 + initialDate.getMinutes() : null,
  );
  const [note, setNote] = useState(initial?.quote ?? '');

  const price = parseMoney(priceText);
  const proposed = dayIndex !== null && slot !== null ? atSlot(days[dayIndex]!, slot) : null;
  const inPast = !!proposed && proposed.getTime() <= Date.now();
  const canSend = price !== null && !!proposed && !inPast && !submitting;

  const submit = () => {
    if (!canSend || price === null || !proposed) return;
    onSubmit({
      quotedPrice: price,
      proposedAt: proposed.toISOString(),
      // The text quote doubles as the summary shown in lists.
      quote: `${formatMoney(price)} · ${formatDay(proposed)}, ${formatTime(proposed)}${note.trim() ? ` · ${note.trim()}` : ''}`.slice(0, 240),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: V.bg, paddingTop: tokens.spacing[5] }}>
        <Row justify="between" align="center" style={{ paddingHorizontal: tokens.spacing[6] }}>
          <Text variant="heading" style={{ color: V.textPrimary }}>Send a quote</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onCancel} hitSlop={10}>
            <Ionicons name="close" size={24} color={V.textSecondary} />
          </Pressable>
        </Row>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: tokens.spacing[6], gap: tokens.spacing[6], paddingBottom: 140 }}
        >
          <Stack gap={tokens.spacing[2]}>
            <Label>PRICE</Label>
            <Row
              align="center"
              gap={tokens.spacing[2]}
              style={{
                borderWidth: 1,
                borderColor: V.cardBorder,
                borderRadius: tokens.radii.lg,
                backgroundColor: V.card,
                paddingHorizontal: tokens.spacing[4],
                paddingVertical: tokens.spacing[3],
              }}
            >
              <Text variant="heading" style={{ color: V.textSecondary }}>{CURRENCY_SYMBOL}</Text>
              <TextInput
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                accessibilityLabel="Price"
                placeholder="45,000"
                placeholderTextColor={V.textSecondary}
                style={{ flex: 1, fontFamily: tokens.fontFamily.sansMedium, fontSize: 20, color: V.textPrimary }}
              />
            </Row>
          </Stack>

          <Stack gap={tokens.spacing[2]}>
            <Label>DAY</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: tokens.spacing[2] }}>
              {days.map((d, i) => (
                <Chip key={d.toISOString()} label={i === 0 ? 'Today' : formatDay(d)} selected={dayIndex === i} onPress={() => setDayIndex(i)} />
              ))}
            </ScrollView>
          </Stack>

          <Stack gap={tokens.spacing[2]}>
            <Label>TIME</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing[2] }}>
              {SLOTS.map((m) => {
                const pastToday = dayIndex !== null && atSlot(days[dayIndex]!, m).getTime() <= Date.now();
                return (
                  <Chip
                    key={m}
                    label={formatTime(atSlot(days[0]!, m))}
                    selected={slot === m}
                    disabled={pastToday}
                    onPress={() => setSlot(m)}
                  />
                );
              })}
            </View>
          </Stack>

          <Stack gap={tokens.spacing[2]}>
            <Label>NOTE (OPTIONAL)</Label>
            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={120}
              accessibilityLabel="Note for the client"
              placeholder="e.g. 90 min · in studio, Lekki"
              placeholderTextColor={V.textSecondary}
              style={{
                borderWidth: 1,
                borderColor: V.cardBorder,
                borderRadius: tokens.radii.lg,
                backgroundColor: V.card,
                paddingHorizontal: tokens.spacing[4],
                paddingVertical: tokens.spacing[3],
                fontFamily: tokens.fontFamily.sans,
                fontSize: 15,
                color: V.textPrimary,
              }}
            />
          </Stack>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: tokens.spacing[6],
            paddingBottom: insets.bottom + tokens.spacing[4],
            backgroundColor: V.bg,
            borderTopWidth: 1,
            borderTopColor: V.cardBorder,
            gap: tokens.spacing[2],
          }}
        >
          {proposed && price !== null && !inPast ? (
            <Text variant="caption" align="center" style={{ color: V.textSecondary }}>
              {formatMoney(price)} · {formatDay(proposed)} at {formatTime(proposed)}
            </Text>
          ) : (
            <Text variant="caption" align="center" style={{ color: V.textSecondary }}>
              {inPast ? 'Pick a time in the future' : 'Set a price, day and time'}
            </Text>
          )}
          <Button label={submitting ? 'Sending…' : 'Send quote'} variant="primary" fullWidth loading={submitting} disabled={!canSend} onPress={submit} />
        </View>
      </View>
    </Modal>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="caption" weight="semibold" style={{ color: V.textSecondary, letterSpacing: 0.6 }}>
      {children}
    </Text>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: tokens.spacing[3],
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? V.accent : V.cardBorder,
        backgroundColor: selected ? V.accent : V.card,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text variant="caption" weight="semibold" style={{ color: selected ? '#FDFAF6' : V.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}
