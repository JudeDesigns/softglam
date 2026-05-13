import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/state/session';

export default function Profile() {
  const { role, signOut } = useSession();
  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-bold text-2xl text-fg-primary">Profile</Text>
        <Text className="mt-2 font-sans text-sm text-fg-secondary">Signed in as {role}</Text>
        <Pressable
          onPress={signOut}
          className="mt-8 rounded-xl border border-line-default bg-surface-solid px-6 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-fg-primary">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
