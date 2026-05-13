import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/state/session';

export default function Home() {
  const { role } = useSession();
  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 96 }}>
        <Text className="font-sans text-sm text-fg-secondary">Hello,</Text>
        <Text className="mt-1 font-bold text-3xl text-fg-primary">
          {role === 'artist' ? "Today's Roster" : "Let's take care of your skin"}
        </Text>
        <View className="mt-8 h-40 rounded-2xl bg-accent-primary p-6">
          <Text className="font-medium text-sm text-white/80">Skin Report</Text>
          <Text className="mt-2 font-bold text-5xl text-white">78%</Text>
          <Text className="mt-1 font-sans text-sm text-white/80">Good progress</Text>
        </View>
        <Text className="mt-8 font-semibold text-base text-fg-primary">Suggested for you</Text>
        <Text className="mt-1 font-sans text-sm text-fg-secondary">
          Product carousel goes here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
