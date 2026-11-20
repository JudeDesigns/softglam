import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@softglow/tokens';
import { Button, Card, IconButton, Row, Screen, Stack, Text } from '@softglow/ui';

import type { ApiAppointmentProduct } from '@/api/types';
import { CURRENCY_SYMBOL, formatDateTime, formatMoney, parseMoney } from '@/lib/format';
import { V } from '@/look-share/components';
import { useAppointments } from '@/state/appointments';
import { BOOKING_STATUS } from '@/lib/booking-status';

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Check your connection and try again.';
}

/**
 * Artist booking detail: confirm / complete / cancel, the final price, and the
 * products used — which together give the cost and margin for this client.
 */
export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const appt = useAppointments((s) => s.appointments.find((a) => a.id === id));
  const refresh = useAppointments((s) => s.refresh);
  const confirm = useAppointments((s) => s.confirm);
  const complete = useAppointments((s) => s.complete);
  const cancel = useAppointments((s) => s.cancel);
  const update = useAppointments((s) => s.update);
  const addProduct = useAppointments((s) => s.addProduct);
  const removeProduct = useAppointments((s) => s.removeProduct);

  const [busy, setBusy] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (id) void refresh(id).catch(() => undefined);
  }, [id, refresh]);

  useEffect(() => {
    const p = appt?.final_price ?? appt?.quoted_price;
    setPriceText(p != null ? String(p) : '');
  }, [appt?.final_price, appt?.quoted_price]);

  if (!appt) {
    return (
      <Screen style={{ backgroundColor: V.bg }}>
        <ActivityIndicator color={V.accent} />
      </Screen>
    );
  }

  const run = async (action: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      Alert.alert(failTitle, errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const status = BOOKING_STATUS[appt.status];
  const isOpen = appt.status === 'booked' || appt.status === 'confirmed';
  const totalCost = appt.products.reduce((sum, p) => sum + p.cogs, 0);
  const price = appt.final_price ?? appt.quoted_price;
  const margin = price && price > 0 ? Math.round(((price - totalCost) / price) * 100) : null;
  const typedPrice = parseMoney(priceText);
  const priceChanged = typedPrice !== null && typedPrice !== (appt.final_price ?? appt.quoted_price);

  const onCancel = () =>
    Alert.alert('Cancel this booking?', `${appt.client_name || 'The client'} will see it as cancelled.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => void run(() => cancel(appt.id), "Couldn't cancel") },
    ]);

  const onRemoveProduct = (p: ApiAppointmentProduct) =>
    Alert.alert(`Remove ${p.product_name}?`, undefined, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void run(() => removeProduct(appt.id, p.id), "Couldn't remove") },
    ]);

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: tokens.spacing[6], paddingBottom: (isOpen ? 120 : 40) + insets.bottom }}
      >
        <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
          <IconButton
            icon={<Ionicons name="chevron-back" size={20} color={V.textPrimary} />}
            accessibilityLabel="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/bookings'))}
          />
          <Text variant="caption" weight="medium" style={{ color: V.textSecondary, letterSpacing: 1.2 }}>
            BOOKING
          </Text>
          <View style={{ width: 40 }} />
        </Row>

        {/* Summary */}
        <Card padding={tokens.spacing[5]} elevation="sm" style={{ backgroundColor: V.card, borderColor: V.cardBorder, borderWidth: 1 }}>
          <Stack gap={tokens.spacing[2]}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: status.bg }}>
              <Text variant="caption" weight="semibold" style={{ color: status.text, fontSize: 11 }}>{status.label}</Text>
            </View>
            <Text variant="title" style={{ color: V.textPrimary }}>{appt.client_name || 'Client'}</Text>
            <Text variant="bodySm" style={{ color: V.textSecondary }}>{appt.service_name}</Text>
            <Row gap={tokens.spacing[2]} align="center">
              <Ionicons name="calendar-outline" size={16} color={V.accent} />
              <Text variant="bodySm" weight="medium" style={{ color: V.textPrimary }}>{formatDateTime(appt.scheduled_at)}</Text>
            </Row>
            {appt.location ? (
              <Row gap={tokens.spacing[2]} align="center">
                <Ionicons name="location-outline" size={16} color={V.accent} />
                <Text variant="bodySm" style={{ color: V.textPrimary }}>{appt.location}</Text>
              </Row>
            ) : null}
            {appt.notes ? (
              <Text variant="bodySm" style={{ color: V.textSecondary, fontStyle: 'italic' }}>&ldquo;{appt.notes}&rdquo;</Text>
            ) : null}
            {appt.look_request_id ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push(`/(app)/inbox/${appt.look_request_id}`)}
                style={{ marginTop: tokens.spacing[1] }}
              >
                <Text variant="caption" weight="semibold" style={{ color: V.accent }}>View the look they sent ›</Text>
              </Pressable>
            ) : null}
          </Stack>
        </Card>

        {/* Price */}
        <SectionTitle>PRICE</SectionTitle>
        <Row gap={tokens.spacing[3]} align="center">
          <Row
            align="center"
            gap={tokens.spacing[2]}
            style={{ flex: 1, borderWidth: 1, borderColor: V.cardBorder, borderRadius: tokens.radii.lg, backgroundColor: V.card, paddingHorizontal: tokens.spacing[4], paddingVertical: tokens.spacing[3] }}
          >
            <Text variant="heading" style={{ color: V.textSecondary }}>{CURRENCY_SYMBOL}</Text>
            <TextInput
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
              accessibilityLabel="Final price"
              placeholder="0"
              placeholderTextColor={V.textSecondary}
              style={{ flex: 1, fontFamily: tokens.fontFamily.sansMedium, fontSize: 18, color: V.textPrimary }}
            />
          </Row>
          {priceChanged && (
            <Button
              label="Save"
              variant="primary"
              disabled={busy}
              onPress={() => void run(() => update(appt.id, { final_price: typedPrice }), "Couldn't save the price")}
            />
          )}
        </Row>
        <Text variant="caption" style={{ color: V.textSecondary, marginTop: 4 }}>
          {appt.final_price != null ? 'Final price charged.' : 'From your quote. Change it if the final price differs.'}
        </Text>

        {/* Products used */}
        <SectionTitle>PRODUCTS USED</SectionTitle>
        <Card padding={tokens.spacing[4]} elevation="sm" style={{ backgroundColor: V.card, borderColor: V.cardBorder, borderWidth: 1 }}>
          <Stack gap={tokens.spacing[3]}>
            {appt.products.length === 0 && !adding ? (
              <Text variant="bodySm" style={{ color: V.textSecondary }}>
                Log what you used from your kit to see what this client cost you.
              </Text>
            ) : null}
            {appt.products.map((p) => (
              <Row key={p.id} align="center" gap={tokens.spacing[3]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodySm" weight="medium" numberOfLines={1} style={{ color: V.textPrimary }}>{p.product_name}</Text>
                  <Text variant="caption" style={{ color: V.textSecondary }}>
                    {[p.brand, `${p.quantity} × ${formatMoney(p.unit_cost)}`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text variant="bodySm" weight="semibold" style={{ color: V.textPrimary }}>{formatMoney(p.cogs)}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.product_name}`} hitSlop={8} onPress={() => onRemoveProduct(p)} disabled={busy}>
                  <Ionicons name="trash-outline" size={18} color={V.textSecondary} />
                </Pressable>
              </Row>
            ))}
            {adding ? (
              <AddProductForm
                busy={busy}
                onCancel={() => setAdding(false)}
                onAdd={(input) =>
                  void run(async () => {
                    await addProduct(appt.id, input);
                    setAdding(false);
                  }, "Couldn't add the product")
                }
              />
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={{ paddingVertical: 4 }}>
                <Row gap={tokens.spacing[2]} align="center">
                  <Ionicons name="add-circle-outline" size={20} color={V.accent} />
                  <Text variant="bodySm" weight="semibold" style={{ color: V.accent }}>Add a product</Text>
                </Row>
              </Pressable>
            )}
          </Stack>
        </Card>

        {/* Cost summary */}
        <SectionTitle>THIS CLIENT</SectionTitle>
        <Card padding={tokens.spacing[5]} elevation="sm" style={{ backgroundColor: V.textPrimary, borderWidth: 0 }}>
          <Row justify="between">
            <Metric label="Price" value={price != null ? formatMoney(price) : '—'} />
            <Metric label="Product cost" value={formatMoney(totalCost)} />
            <Metric label="Margin" value={margin != null ? `${margin}%` : '—'} highlight />
          </Row>
        </Card>
      </ScrollView>

      {isOpen && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: tokens.spacing[6],
            paddingTop: tokens.spacing[4],
            paddingBottom: insets.bottom + tokens.spacing[4],
            backgroundColor: V.bg,
            borderTopWidth: 1,
            borderTopColor: V.cardBorder,
          }}
        >
          <Row gap={tokens.spacing[3]}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="secondary" fullWidth disabled={busy} onPress={onCancel} />
            </View>
            <View style={{ flex: 2 }}>
              {appt.status === 'booked' ? (
                <Button label="Confirm booking" variant="primary" fullWidth loading={busy} disabled={busy} onPress={() => void run(() => confirm(appt.id), "Couldn't confirm")} />
              ) : (
                <Button label="Mark complete" variant="primary" fullWidth loading={busy} disabled={busy} onPress={() => void run(() => complete(appt.id), "Couldn't complete")} />
              )}
            </View>
          </Row>
        </View>
      )}
    </Screen>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      variant="caption"
      weight="semibold"
      style={{ color: V.textSecondary, letterSpacing: 0.6, marginTop: tokens.spacing[7], marginBottom: tokens.spacing[2] }}
    >
      {children}
    </Text>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Stack gap={4}>
      <Text variant="caption" style={{ color: 'rgba(253,250,246,0.7)' }}>{label}</Text>
      <Text variant="heading" style={{ color: highlight ? '#E8C79A' : '#FDFAF6' }}>{value}</Text>
    </Stack>
  );
}

function AddProductForm({
  busy,
  onCancel,
  onAdd,
}: {
  busy: boolean;
  onCancel: () => void;
  onAdd: (input: { product_name: string; brand: string; quantity: number; unit_cost: number }) => void;
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');

  const quantity = Number(qty.replace(',', '.'));
  const unitCost = parseMoney(cost);
  const valid = name.trim().length > 0 && quantity > 0 && Number.isFinite(quantity) && unitCost !== null;

  return (
    <Stack gap={tokens.spacing[2]}>
      <Field value={name} onChange={setName} placeholder="Product, e.g. Studio Fix foundation" label="Product name" />
      <Field value={brand} onChange={setBrand} placeholder="Brand (optional)" label="Brand" />
      <Row gap={tokens.spacing[2]}>
        <View style={{ flex: 1 }}>
          <Field value={qty} onChange={setQty} placeholder="Qty" label="Quantity used" numeric />
        </View>
        <View style={{ flex: 2 }}>
          <Field value={cost} onChange={setCost} placeholder={`Cost per unit (${CURRENCY_SYMBOL})`} label="Cost per unit" numeric />
        </View>
      </Row>
      <Text variant="caption" style={{ color: V.textSecondary }}>
        Quantity can be a fraction, e.g. 0.1 of a bottle.
      </Text>
      <Row gap={tokens.spacing[2]}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="secondary" fullWidth onPress={onCancel} disabled={busy} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Add"
            variant="primary"
            fullWidth
            disabled={!valid || busy}
            onPress={() => unitCost !== null && onAdd({ product_name: name.trim(), brand: brand.trim(), quantity, unit_cost: unitCost })}
          />
        </View>
      </Row>
    </Stack>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  label,
  numeric,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  numeric?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      accessibilityLabel={label}
      placeholderTextColor={V.textSecondary}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      style={{
        borderWidth: 1,
        borderColor: V.cardBorder,
        borderRadius: tokens.radii.md,
        backgroundColor: V.bg,
        paddingHorizontal: tokens.spacing[3],
        paddingVertical: tokens.spacing[2],
        fontFamily: tokens.fontFamily.sans,
        fontSize: 15,
        color: V.textPrimary,
      }}
    />
  );
}
