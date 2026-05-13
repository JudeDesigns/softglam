import { Pressable, Text, View } from 'react-native';
import { useSession } from '@/state/session';

/**
 * Placeholder sign-in. Real flow (email/Apple/Google) wired after the API exists.
 * For now exposes two buttons so we can verify role-gated navigation works.
 */
export default function SignIn() {
  const { signIn } = useSession();

  return (
    <View className="flex-1 items-center justify-center bg-bg-base px-6">
      <Text className="font-bold text-3xl text-fg-primary">SoftGlow</Text>
      <Text className="mt-2 font-sans text-base text-fg-secondary">
        Skin-first beauty, made personal.
      </Text>

      <View className="mt-12 w-full gap-3">
        <Pressable
          onPress={() => signIn('client')}
          className="items-center rounded-xl bg-accent-primary py-4 active:opacity-80"
        >
          <Text className="font-semibold text-base text-white">Continue as Client</Text>
        </Pressable>

        <Pressable
          onPress={() => signIn('artist')}
          className="items-center rounded-xl border border-line-default bg-surface-solid py-4 active:opacity-80"
        >
          <Text className="font-semibold text-base text-fg-primary">Continue as Artist</Text>
        </Pressable>
      </View>

      <Text className="mt-10 font-sans text-xs text-fg-tertiary">
        Real authentication wired in the next phase.
      </Text>
    </View>
  );
}
