import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Shop() {
  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-bold text-2xl text-fg-primary">Shop</Text>
        <Text className="mt-2 text-center font-sans text-sm text-fg-secondary">
          Product catalog and cart land here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
