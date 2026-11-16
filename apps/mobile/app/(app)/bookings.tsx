import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import { Avatar, Row, Screen, Stack, Text } from '@softglow/ui';

import type { ApiAppointment, ApiAppointmentStatus } from '@/api/types';
import { formatDateTime, formatMoney } from '@/lib/format';
import { V } from '@/look-share/components';
import { useAppointments } from '@/state/appointments';
import { BOOKING_STATUS } from '@/lib/booking-status';

type Tab = 'upcoming' | 'past';

const OPEN: ApiAppointmentStatus[] = ['booked', 'confirmed'];


/** Artist-only: every booking, upcoming first, with status and price. */
export default function Bookings() {
  const appointments = useAppointments((s) => s.appointments);
  const isLoading = useAppointments((s) => s.isLoading);
  const error = useAppointments((s) => s.error);
  const fetchAll = useAppointments((s) => s.fetchFromApi);
  const [tab, setTab] = useState<Tab>('upcoming');

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const { upcoming, past } = useMemo(() => {
    // Open bookings stay under "Upcoming" even once their time has passed,
    // because the artist still needs to mark them complete (and log products).
    const up: ApiAppointment[] = [];
    const done: ApiAppointment[] = [];
    for (const a of appointments) (OPEN.includes(a.status) ? up : done).push(a);
    up.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    done.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
    return { upcoming: up, past: done };
  }, [appointments]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <Screen scroll={false} padding={0} style={{ backgroundColor: V.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: tokens.spacing[6], paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void fetchAll()} />}
      >
        <Text variant="caption" weight="medium" style={{ color: V.textSecondary, letterSpacing: 1.2 }}>
          BOOKINGS
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, lineHeight: 36, color: V.textPrimary }}>
          Your appointments
        </Text>

        <Row gap={tokens.spacing[2]} style={{ marginTop: tokens.spacing[5], marginBottom: tokens.spacing[5] }}>
          <TabChip label={`Upcoming · ${upcoming.length}`} active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
          <TabChip label={`Past · ${past.length}`} active={tab === 'past'} onPress={() => setTab('past')} />
        </Row>

        {error && appointments.length === 0 ? (
          <Empty icon="cloud-offline-outline" title="Couldn't load bookings" body={error} />
        ) : isLoading && appointments.length === 0 ? (
          <ActivityIndicator color={V.accent} />
        ) : list.length === 0 ? (
          <Empty
            icon="calendar-outline"
            title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings yet'}
            body="When a client accepts one of your quotes, the booking appears here."
          />
        ) : (
          <Stack gap={tokens.spacing[3]}>
            {list.map((a) => (
              <BookingRow key={a.id} appt={a} onPress={() => router.push(`/(app)/bookings/${a.id}`)} />
            ))}
          </Stack>
        )}
      </ScrollView>
    </Screen>
  );
}

function BookingRow({ appt, onPress }: { appt: ApiAppointment; onPress: () => void }) {
  const status = BOOKING_STATUS[appt.status];
  const price = appt.final_price ?? appt.quoted_price;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: V.cardBorder,
        backgroundColor: V.card,
        borderRadius: tokens.radii.xl,
        padding: tokens.spacing[4],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Row gap={tokens.spacing[3]} align="center">
        <Avatar name={appt.client_name || 'Client'} size="md" />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="bodySm" weight="semibold" numberOfLines={1} style={{ color: V.textPrimary }}>
            {appt.client_name || 'Client'}
          </Text>
          <Text variant="caption" numberOfLines={1} style={{ color: V.textSecondary }}>
            {appt.service_name}
          </Text>
          <Text variant="caption" style={{ color: V.textPrimary }}>
            {formatDateTime(appt.scheduled_at)}
          </Text>
        </View>
        <Stack gap={6} align="end">
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: status.bg }}>
            <Text variant="caption" weight="semibold" style={{ color: status.text, fontSize: 11 }}>
              {status.label}
            </Text>
          </View>
          {price != null && (
            <Text variant="bodySm" weight="semibold" style={{ color: V.textPrimary }}>
              {formatMoney(price)}
            </Text>
          )}
        </Stack>
      </Row>
    </Pressable>
  );
}

function TabChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? V.accent : V.cardBorder,
        backgroundColor: active ? V.accent : 'transparent',
      }}
    >
      <Text variant="caption" weight="semibold" style={{ color: active ? '#FDFAF6' : V.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Empty({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <Stack gap={tokens.spacing[2]} align="center" style={{ paddingVertical: tokens.spacing[10] }}>
      <Ionicons name={icon} size={32} color={V.textSecondary} />
      <Text variant="heading" align="center" style={{ color: V.textPrimary }}>{title}</Text>
      <Text variant="bodySm" align="center" style={{ color: V.textSecondary, maxWidth: 280 }}>{body}</Text>
    </Stack>
  );
}
