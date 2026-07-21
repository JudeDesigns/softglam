import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Try-on screen — full interactive version requires a dev build.
 * The AI-powered look generation flow is available via Look Share.
 */
export default function TryOn() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Virtual Try-On</Text>
        <Text style={styles.sub}>
          This feature is available in the full build.{'\n'}Use Look Share to generate AI looks.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '600', color: '#111', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
});
