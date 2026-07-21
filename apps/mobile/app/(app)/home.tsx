import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@softglow/tokens';
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  MetricPill,
  ProductCard,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
} from '@softglow/ui';
import { CONCERN_LABELS, topConcerns as pickTopConcerns } from '@softglow/types';

import { useSession } from '@/state/session';
import { useSkinProfile } from '@/state/skin-profile';
import { useProducts } from '@/state/products';
import { BAND_COPY, bandForScore } from '@/lib/skin-health';
import { LookThumb } from '@/try-on/components';
import { topLooksForProfile } from '@/look-share/ranking';
import { LOOK_SECTIONS } from '@/try-on/looks';
import { STATUS_LABEL, useLookRequests, type LookRequest } from '@/state/look-requests';

export default function Home() {
  const { role, user } = useSession();
  const profile = useSkinProfile((s) => s.profile);
  const onboardingSkipped = useSkinProfile((s) => s.onboardingSkipped);
  const resumeOnboarding = useSkinProfile((s) => s.resumeOnboarding);

  const products = useProducts((s) => s.products);
  const fetchProducts = useProducts((s) => s.fetch);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  const topConcerns = useMemo(
    () => (profile ? pickTopConcerns(profile.concerns, 3) : []),
    [profile],
  );

  const recommended = useMemo(() => {
    if (products.length === 0) return [];
    if (topConcerns.length === 0) return products.slice(0, 6);
    const concernSet = new Set(topConcerns.map((c) => c.concern));
    return [...products]
      .sort((a, b) => {
        const scoreA = a.targets.filter((t) => concernSet.has(t as never)).length;
        const scoreB = b.targets.filter((t) => concernSet.has(t as never)).length;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [products, topConcerns]);

  if (role === 'artist') return <ArtistHome />;

  const startAssessment = () => {
    resumeOnboarding();
    router.push('/(onboarding)/welcome');
  };

  return (
    <Screen style={{ backgroundColor: '#FDFAF6' }}>
      <Header name={user?.displayName ?? 'You'} />

      <HomeHeroPager
        skinCard={
          profile ? (
            <SkinScoreHeroCard
              score={profile.healthScore}
              onPress={() => router.push('/(onboarding)/result')}
            />
          ) : (
            <SkinScoreCheckInCard skipped={onboardingSkipped} onPress={startAssessment} />
          )
        }
        lookCard={<SendALookCard hasProfile={!!profile} score={profile?.healthScore ?? null} />}
      />

      {profile && topConcerns.length > 0 ? (
        <View style={{ marginTop: tokens.spacing[5], marginBottom: tokens.spacing[2] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap={tokens.spacing[3]} style={{ paddingHorizontal: tokens.spacing[1] }}>
              {topConcerns.map((c) => (
                <MetricPill
                  key={c.concern}
                  label={CONCERN_LABELS[c.concern]}
                  value={(c.severity / 4) * 100}
                  displayValue={`${c.severity}/4`}
                  tone={c.severity >= 3 ? 'danger' : c.severity >= 2 ? 'warning' : 'accent'}
                />
              ))}
            </Row>
          </ScrollView>
        </View>
      ) : null}

      <Zone kicker="TODAY" title="Your ritual">
        <DailyRitualCard hasProfile={!!profile} />
      </Zone>

      <SectionDivider />

      <Zone
        kicker={profile ? 'MATCHED FOR YOU' : 'DISCOVER'}
        title={profile ? 'Looks shaped by your skin' : 'Looks for you'}
        caption={profile ? 'Tap any look to send it to your artist' : 'Curated edits, send any to an artist'}
        action={{ label: 'See all', onPress: () => router.push('/(app)/look-share') }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row align="start" gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[4] }}>
            {(profile
              ? topLooksForProfile(profile, 6)
              : LOOK_SECTIONS.slice(0, 2).flatMap((s) => s.looks.slice(0, 3))
            ).map((look) => (
              <LookThumb
                key={look.id}
                look={look}
                selected={false}
                width={168}
                onPress={() => router.push(`/(app)/look-share/${look.id}`)}
              />
            ))}
          </Row>
        </ScrollView>
      </Zone>

      <SectionDivider />

      <Zone
        title={profile ? 'Recommended for you' : 'Popular right now'}
        caption={profile ? 'From your top concerns' : 'Trending in the SoftGlow shop'}
        action={{ label: 'See all', onPress: () => router.push('/(app)/shop') }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row align="start" gap={tokens.spacing[3]} style={{ paddingRight: tokens.spacing[4] }}>
            {recommended.slice(0, 6).map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                brand={p.brand}
                price={`$${p.price.toFixed(2)}`}
                badge={p.is_toxin_free ? { label: 'Clean', tone: 'accent' } : undefined}
                onPress={() => {}}
              />
            ))}
          </Row>
        </ScrollView>
      </Zone>

      <SectionDivider />

      <Zone kicker="EDITORIAL" title="Editor's edit" caption="Handpicked by our beauty desk">
        <Stack gap={tokens.spacing[3]}>
          {EDITOR_STORIES.map((story) => (
            <EditorialRow key={story.id} story={story} />
          ))}
        </Stack>
      </Zone>

      <View style={{ marginTop: tokens.spacing[12], marginBottom: tokens.spacing[4] }}>
        <ConsultCard />
      </View>
    </Screen>
  );
}

interface ZoneProps {
  kicker?: string;
  title: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}

/** Subtle full-width hairline with generous vertical breathing room */
function SectionDivider() {
  return (
    <View
      style={{
        marginVertical: tokens.spacing[8],
        height: 1,
        backgroundColor: '#EDE4D9',
        opacity: 0.7,
      }}
    />
  );
}

function Zone({ kicker, title, caption, action, children }: ZoneProps) {
  return (
    <View>
      <View style={{ marginBottom: tokens.spacing[4] }}>
        {kicker ? (
          <Text
            variant="caption"
            weight="medium"
            style={{ color: '#BDA898', marginBottom: 4 }}
          >
            {kicker}
          </Text>
        ) : null}
        <Row justify="between" align="center">
          <View style={{ flex: 1 }}>
            {/* Section header with accent underline accent */}
            <View>
              <Text
                variant="heading"
                style={{
                  fontFamily: 'PlayfairDisplay_500Medium',
                  fontSize: 20,
                  color: '#2B211D',
                }}
              >
                {title}
              </Text>
              <View
                style={{
                  width: 28,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: '#C97B6A',
                  marginTop: 3,
                }}
              />
            </View>
            {caption ? (
              <Text variant="bodySm" style={{ color: '#9A8070', marginTop: 4 }}>
                {caption}
              </Text>
            ) : null}
          </View>
          {action ? (
            <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
              <Text variant="label" weight="semibold" style={{ color: '#C97B6A' }}>
                {action.label}
              </Text>
            </Pressable>
          ) : null}
        </Row>
      </View>
      {children}
    </View>
  );
}

function Header({ name }: { name: string }) {
  return (
    <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[6] }}>
      <View>
        <Text variant="bodySm" style={{ color: '#9A8070' }}>Good morning,</Text>
        <Text
          variant="title"
          style={{
            fontFamily: 'PlayfairDisplay_600SemiBold',
            fontSize: 28,
            color: '#2B211D',
          }}
        >
          {name}
        </Text>
      </View>
      <Row gap={tokens.spacing[2]}>
        <IconButton
          icon={<Ionicons name="notifications-outline" size={20} color="#2B211D" />}
          accessibilityLabel="Notifications"
        />
        <Avatar name={name} size="md" />
      </Row>
    </Row>
  );
}

/**
 * Horizontal pager for the home hero zone. Two same-shaped action cards
 * (Skin Health Score · Send a look) swipe left/right; the dot indicator below
 * tracks the scroll position continuously (width and color interpolate, no
 * snap-jump). The pager bleeds to the full screen width so the peek of the
 * next card is visible past the Screen's content padding.
 */
function HomeHeroPager({
  skinCard,
  lookCard,
}: {
  skinCard: React.ReactNode;
  lookCard: React.ReactNode;
}) {
  const { width: winWidth } = useWindowDimensions();
  const screenPad = tokens.spacing[6];
  const cardGap = tokens.spacing[3];
  // Card is screen width minus the screen padding on the left AND a small
  // peek of the next card on the right. The peek doubles as scroll affordance.
  const peek = tokens.spacing[5];
  const cardWidth = winWidth - screenPad - peek;
  const snap = cardWidth + cardGap;

  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    // Negative horizontal margin so the carousel bleeds past the Screen's
    // padding; the explicit transparent bg ensures we never overlay a darker
    // surface behind the cards.
    <View style={{ marginHorizontal: -screenPad, backgroundColor: 'transparent' }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snap}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: screenPad, gap: cardGap }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      >
        <View style={{ width: cardWidth }}>{skinCard}</View>
        <View style={{ width: cardWidth }}>{lookCard}</View>
      </Animated.ScrollView>
      <Row gap={tokens.spacing[2]} justify="center" style={{ marginTop: tokens.spacing[4] }}>
        {[0, 1].map((i) => {
          // Per-dot "active-ness" — 1 when its card is centered, 0 when the
          // other is centered, smooth interpolation in between.
          const activeness = scrollX.interpolate({
            inputRange: [0, snap],
            outputRange: i === 0 ? [1, 0] : [0, 1],
            extrapolate: 'clamp',
          });
          const width = activeness.interpolate({ inputRange: [0, 1], outputRange: [6, 22] });
          const bg = activeness.interpolate({
            inputRange: [0, 1],
            outputRange: ['#E4D9CD', '#2B211D'],
          });
          return (
            <Animated.View
              key={i}
              style={{
                width,
                height: 6,
                borderRadius: 3,
                backgroundColor: bg,
              }}
            />
          );
        })}
      </Row>
    </View>
  );
}

interface HeroActionCardProps {
  kicker: string;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Optional leading badge (e.g. the numeric score). Replaces the icon circle. */
  scoreBadge?: number;
}

/**
 * Shared hero card shape — dark surface, Rose Clay-tinted icon circle on the left,
 * kicker / title / body block in the middle, chevron on the right. The whole
 * tile is a single pressable target.
 */
function HeroActionCard({ kicker, title, body, icon, onPress, scoreBadge }: HeroActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}
    >
      {/* `lg` instead of `hero` so the shadow doesn't bleed into the carousel
          gap and darken the visible "container" between adjacent cards. */}
      <Card surface="hero" elevation="lg" borderless padding={tokens.spacing[5]}
        style={{ backgroundColor: '#2B211D' }}
      >
        <Row align="center" gap={tokens.spacing[4]}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(201,123,106,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {scoreBadge != null ? (
              <Text variant="heading" tone="accentOnHero" weight="bold" style={{ color: '#C97B6A' }}>
                {scoreBadge}
              </Text>
            ) : (
              <Ionicons name={icon} size={24} color="#C97B6A" />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="caption" weight="semibold" style={{ color: '#C97B6A' }}>{kicker}</Text>
            <Text variant="heading" tone="onHero" numberOfLines={1} style={{ marginTop: 2, color: '#FDFAF6' }}>
              {title}
            </Text>
            <Text variant="caption" tone="onHero" style={{ opacity: 0.86, marginTop: 2, color: '#FDFAF6' }} numberOfLines={2}>
              {body}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C97B6A" />
        </Row>
      </Card>
    </Pressable>
  );
}

function SkinScoreCheckInCard({ skipped, onPress }: { skipped: boolean; onPress: () => void }) {
  return (
    <HeroActionCard
      kicker="SKIN HEALTH SCORE"
      title={skipped ? 'Pick up where you left off' : 'Get your Skin Health Score'}
      body="A 2-minute guided check-in. No selfies required."
      icon="sparkles"
      onPress={onPress}
    />
  );
}

function SkinScoreHeroCard({ score, onPress }: { score: number; onPress: () => void }) {
  const band = bandForScore(score);
  const copy = BAND_COPY[band];
  return (
    <HeroActionCard
      kicker="SKIN HEALTH SCORE"
      title={copy.headline}
      body={`${copy.caption} · Tap to see what we're tracking.`}
      icon="sparkles"
      onPress={onPress}
      scoreBadge={score}
    />
  );
}

function SendALookCard({ hasProfile, score }: { hasProfile: boolean; score: number | null }) {
  return (
    <HeroActionCard
      kicker="SEND A LOOK"
      title="Get your look from an artist"
      body={
        hasProfile && score != null
          ? `Looks tuned to your skin score (${score}). Pick one, preview it on you, send it.`
          : 'Pick a look, preview it on your face, send it to your artist.'
      }
      icon="paper-plane"
      onPress={() => router.push('/(app)/look-share')}
    />
  );
}

function ArtistHome() {
  const requests = useLookRequests((s) => s.requests);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const recent = requests.slice(0, 3);

  return (
    <Screen style={{ backgroundColor: '#FDFAF6' }}>
      <Header name="Alex" />

      <Card
        surface="hero"
        elevation="hero"
        borderless
        padding={tokens.spacing[6]}
        style={{ backgroundColor: '#2B211D' }}
      >
        <Stack gap={tokens.spacing[2]}>
          <Badge label="Today" tone="accent" onHero />
          <Text variant="title" tone="onHero" style={{ color: '#FDFAF6' }}>3 appointments</Text>
          <Text variant="bodySm" tone="onHero" style={{ opacity: 0.86, color: '#FDFAF6' }}>
            Next at 10:30 — Bridal trial with Priya
          </Text>
        </Stack>
      </Card>

      <View style={{ marginTop: tokens.spacing[6] }}>
        <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[3] }}>
          <Stack gap={4}>
            <Text variant="caption" weight="medium" style={{ color: '#BDA898' }}>INBOX</Text>
            <Text
              variant="heading"
              style={{
                fontFamily: 'PlayfairDisplay_500Medium',
                fontSize: 20,
                color: '#2B211D',
              }}
            >
              {pendingCount > 0 ? `${pendingCount} awaiting your reply` : 'You\u2019re all caught up'}
            </Text>
          </Stack>
          <Pressable onPress={() => router.push('/(app)/inbox')} hitSlop={8} accessibilityRole="button">
            <Text variant="label" weight="semibold" style={{ color: '#C97B6A' }}>Open inbox</Text>
          </Pressable>
        </Row>
        {recent.length > 0 ? (
          <Stack gap={tokens.spacing[3]}>
            {recent.map((r) => (
              <ArtistInboxPreviewRow key={r.id} request={r} />
            ))}
          </Stack>
        ) : (
          <Card
            padding={tokens.spacing[5]}
            elevation="sm"
            style={{ backgroundColor: '#FAF6F1', borderColor: '#E4D9CD' }}
          >
            <Text variant="bodySm" style={{ color: '#9A8070' }}>
              Look requests from your clients will show up here. Invite a client to get started.
            </Text>
          </Card>
        )}
      </View>

      <View style={{ marginTop: tokens.spacing[8] }}>
        <Row gap={tokens.spacing[3]}>
          <View style={{ flex: 1 }}>
            <Button label="Invite client" variant="primary" fullWidth onPress={() => router.push('/(app)/invite')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Browse shop" variant="secondary" fullWidth onPress={() => router.push('/(app)/shop')} />
          </View>
        </Row>
      </View>

      <View style={{ marginTop: tokens.spacing[8] }}>
        <SectionHeader title="Quick actions" />
        <Row gap={tokens.spacing[3]} wrap>
          <Button label="New appointment" variant="secondary" />
          <Button label="Log expense" variant="ghost" />
        </Row>
      </View>
    </Screen>
  );
}

function ArtistInboxPreviewRow({ request }: { request: LookRequest }) {
  const accent = request.status === 'pending';
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      onPress={() => router.push(`/(app)/inbox/${request.id}`)}
      style={({ pressed }) => ({
        borderRadius: tokens.radii.xl,
        backgroundColor: '#FAF6F1',
        borderWidth: 1,
        borderColor: accent ? 'rgba(201,123,106,0.45)' : '#E4D9CD',
        padding: tokens.spacing[4],
        opacity: pressed ? 0.94 : 1,
        ...tokens.shadow.sm,
      })}
    >
      <Row align="center" gap={tokens.spacing[3]}>
        <Avatar name={request.clientName} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="bodySm" weight="semibold" numberOfLines={1} style={{ color: '#2B211D' }}>
            {request.clientName}
          </Text>
          {/* Artist name styled with PlayfairDisplay italic */}
          <Text
            variant="caption"
            numberOfLines={1}
            style={{
              fontFamily: 'PlayfairDisplay_400Regular',
              fontStyle: 'italic',
              color: '#9A8070',
            }}
          >
            Wants &lsquo;{request.lookName}&rsquo;
          </Text>
        </View>
        <Badge
          label={STATUS_LABEL[request.status]}
          tone={request.status === 'pending' ? 'accent' : request.status === 'quoted' ? 'success' : 'info'}
        />
      </Row>
    </Pressable>
  );
}

interface RitualStep {
  id: string;
  label: string;
  hint: string;
  duration: string;
}

const MORNING_RITUAL: RitualStep[] = [
  { id: 'cleanse', label: 'Gentle cleanse',  hint: 'Lukewarm water, 60 seconds',     duration: '1 min' },
  { id: 'serum',   label: 'Hydrating serum', hint: 'Press into skin, do not rub',     duration: '2 min' },
  { id: 'spf',     label: 'SPF 40 finish',   hint: 'Two fingers, ears + neck',        duration: '1 min' },
];

function DailyRitualCard({ hasProfile }: { hasProfile: boolean }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const completed = MORNING_RITUAL.filter((s) => done[s.id]).length;
  const total = MORNING_RITUAL.length;
  const pct = completed / total;
  const headline = completed === total
    ? 'All done — beautiful'
    : completed === 0
      ? (hasProfile ? 'Your morning, 3 steps' : 'Starter ritual')
      : `${completed} of ${total} done`;

  return (
    <Card
      padding={tokens.spacing[6]}
      elevation="sm"
      style={{ backgroundColor: '#FAF6F1', borderColor: '#E4D9CD' }}
    >
      <Row justify="between" align="center" style={{ marginBottom: tokens.spacing[5] }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Ritual kicker: Inter, Sage color */}
          <Text variant="caption" weight="medium" style={{ color: '#8A9A7E' }}>MORNING · ~5 MIN</Text>
          <Text
            variant="heading"
            style={{
              fontFamily: 'PlayfairDisplay_500Medium',
              fontSize: 20,
              color: '#2B211D',
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {headline}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: tokens.spacing[3],
            paddingVertical: tokens.spacing[1],
            borderRadius: tokens.radii.pill,
            backgroundColor: completed === total ? '#C97B6A' : '#F3EBE0',
          }}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: completed === total ? '#FDFAF6' : '#9A8070' }}
          >
            {completed}/{total}
          </Text>
        </View>
      </Row>

      {/* Progress bar */}
      <View
        style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: '#F3EBE0',
          marginBottom: tokens.spacing[5],
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: '#8A9A7E',
          }}
        />
      </View>

      <View>
        {MORNING_RITUAL.map((step, i) => (
          <RitualRow
            key={step.id}
            step={step}
            index={i}
            done={!!done[step.id]}
            isLast={i === MORNING_RITUAL.length - 1}
            onToggle={() => setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
          />
        ))}
      </View>
    </Card>
  );
}

function RitualRow({
  step,
  index,
  done,
  isLast,
  onToggle,
}: {
  step: RitualStep;
  index: number;
  done: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={step.label}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, minHeight: 52, paddingVertical: 10 })}
    >
      <Row align="start" gap={tokens.spacing[4]}>
        <View style={{ alignItems: 'center', width: 28 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: done ? '#8A9A7E' : '#E4D9CD',
              backgroundColor: done ? '#8A9A7E' : '#FAF6F1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {done ? (
              <Ionicons name="checkmark" size={15} color="#FDFAF6" />
            ) : (
              <Text variant="caption" weight="semibold" style={{ color: '#9A8070' }}>{index + 1}</Text>
            )}
          </View>
          {!isLast ? (
            <View
              style={{
                width: 2,
                flexGrow: 1,
                minHeight: 24,
                backgroundColor: done ? '#8A9A7E' : '#E4D9CD',
                marginTop: 4,
                opacity: done ? 0.4 : 1,
              }}
            />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : tokens.spacing[4] }}>
          <Row justify="between" align="center" gap={tokens.spacing[2]} style={{ marginBottom: 2 }}>
            <Text
              variant="bodySm"
              weight="semibold"
              numberOfLines={1}
              style={{
                flex: 1,
                textDecorationLine: done ? 'line-through' : 'none',
                opacity: done ? 0.5 : 1,
                color: '#2B211D',
              }}
            >
              {step.label}
            </Text>
            <Text variant="caption" weight="medium" style={{ color: '#BDA898' }}>{step.duration}</Text>
          </Row>
          <Text
            variant="caption"
            numberOfLines={1}
            style={{ opacity: done ? 0.5 : 1, color: '#BDA898' }}
          >
            {step.hint}
          </Text>
        </View>
      </Row>
    </Pressable>
  );
}

interface EditorStory {
  id: string;
  kicker: string;
  title: string;
  readTime: string;
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const EDITOR_STORIES: EditorStory[] = [
  { id: 'e1', kicker: 'SKIN SCIENCE', title: 'Why barrier repair beats every actives stack', readTime: '4 min read', tint: '#2B211D', icon: 'leaf-outline' },
  { id: 'e2', kicker: 'TECHNIQUE',    title: 'The 60-second tap-in that fixes dull skin',     readTime: '3 min read', tint: '#2B211D', icon: 'water-outline' },
];

function EditorialRow({ story }: { story: EditorStory }) {
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      onPress={() => {}}
      style={({ pressed }) => ({
        borderRadius: tokens.radii.xl,
        backgroundColor: '#FAF6F1',
        borderWidth: 1,
        borderColor: '#E4D9CD',
        opacity: pressed ? 0.94 : 1,
        overflow: 'hidden',
        ...tokens.shadow.sm,
      })}
    >
      <View
        style={{
          aspectRatio: 16 / 9,
          backgroundColor: story.tint,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Ionicons name={story.icon} size={56} color="#C97B6A" />
        <View
          style={{
            position: 'absolute',
            top: tokens.spacing[3],
            left: tokens.spacing[3],
            paddingHorizontal: tokens.spacing[3],
            paddingVertical: 4,
            borderRadius: tokens.radii.pill,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            borderWidth: 1,
            borderColor: 'rgba(201, 123, 106, 0.35)',
          }}
        >
          <Text variant="caption" weight="semibold" style={{ color: '#FDFAF6' }}>{story.kicker}</Text>
        </View>
      </View>
      <View style={{ padding: tokens.spacing[5], gap: tokens.spacing[2] }}>
        <Text
          variant="heading"
          numberOfLines={2}
          style={{
            fontFamily: 'PlayfairDisplay_500Medium',
            fontSize: 20,
            color: '#2B211D',
          }}
        >
          {story.title}
        </Text>
        <Row align="center" justify="between">
          <Text variant="caption" weight="medium" style={{ color: '#BDA898' }}>{story.readTime}</Text>
          <Text variant="caption" weight="semibold" style={{ color: '#C97B6A' }}>Read story →</Text>
        </Row>
      </View>
    </Pressable>
  );
}

function ConsultCard() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Book a virtual consult">
      <Card
        padding={tokens.spacing[5]}
        elevation="sm"
        style={{
          backgroundColor: 'rgba(201,123,106,0.10)',
          borderColor: 'rgba(201, 123, 106, 0.30)',
        }}
      >
        <Row align="center" gap={tokens.spacing[4]}>
          <Avatar name="Dr. Amara" size="lg" />
          <View style={{ flex: 1 }}>
            <Text variant="caption" weight="medium" style={{ color: '#BDA898' }}>VIRTUAL CONSULT</Text>
            <Text
              variant="heading"
              style={{
                fontFamily: 'PlayfairDisplay_500Medium',
                fontSize: 20,
                color: '#2B211D',
                marginTop: 2,
              }}
            >
              Talk to a Softglow expert
            </Text>
            <Text variant="caption" style={{ color: '#9A8070', marginTop: 2 }}>
              15 min · complimentary · this week
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2B211D" />
        </Row>
      </Card>
    </Pressable>
  );
}
