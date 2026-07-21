import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/state/session';
import { ApiError } from '@/api/client';

type Mode = 'sign-in' | 'sign-up';

export default function SignIn() {
  const { signIn, signUp, isLoading } = useSession();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'client' | 'artist'>('client');
  const [error, setError] = useState<string | null>(null);

  const valid =
    email.trim().length > 0 &&
    password.length >= 8 &&
    (mode === 'sign-in' || displayName.trim().length > 0);

  const handleSubmit = async () => {
    if (!valid || isLoading) return;
    setError(null);
    try {
      if (mode === 'sign-in') {
        await signIn({ email: email.trim(), password });
      } else {
        await signUp({
          email: email.trim(),
          password,
          display_name: displayName.trim(),
          role,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Text style={styles.appName}>SuperGlam</Text>
            <Text style={styles.tagline}>Skin-first beauty, made personal.</Text>

            {/* Mode toggle */}
            <View style={styles.modeToggleWrapper}>
              {(['sign-in', 'sign-up'] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setError(null); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  style={[
                    styles.modeTab,
                    mode === m ? styles.modeTabActive : styles.modeTabInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      mode === m ? styles.modeTabTextActive : styles.modeTabTextInactive,
                    ]}
                  >
                    {m === 'sign-in' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.fieldsContainer}>
              {mode === 'sign-up' && (
                <Field
                  label="Full name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoComplete="name"
                />
              )}

              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />

              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              />

              {mode === 'sign-up' && (
                <View>
                  <Text style={styles.roleLabel}>I am a</Text>
                  <View style={styles.roleRow}>
                    {(['client', 'artist'] as const).map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: role === r }}
                        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                        style={[
                          styles.rolePill,
                          role === r ? styles.rolePillActive : styles.rolePillInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rolePillText,
                            role === r ? styles.rolePillTextActive : styles.rolePillTextInactive,
                          ]}
                        >
                          {r === 'client' ? 'Client' : 'Artist'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>
        </ScrollView>

        <Pressable
          onPress={handleSubmit}
          disabled={!valid || isLoading}
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
          style={[
            styles.ctaButton,
            valid && !isLoading ? styles.ctaButtonEnabled : styles.ctaButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaButtonText}>
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor="#BDA898"
        accessibilityLabel={label}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FDFAF6',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  appName: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 36,
    letterSpacing: 0.2,
    color: '#2B211D',
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#9A8070',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modeToggleWrapper: {
    marginTop: 40,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4D9CD',
    overflow: 'hidden',
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modeTabActive: {
    backgroundColor: '#C97B6A',
  },
  modeTabInactive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeTabTextInactive: {
    color: '#9A8070',
  },
  fieldsContainer: {
    marginTop: 32,
    gap: 16,
  },
  fieldLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9A8070',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#F3EBE0',
    borderWidth: 1,
    borderColor: '#E4D9CD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#2B211D',
  },
  roleLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9A8070',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  rolePillActive: {
    borderColor: '#C97B6A',
    backgroundColor: 'rgba(201,123,106,0.12)',
  },
  rolePillInactive: {
    borderColor: '#E4D9CD',
    backgroundColor: '#FFFFFF',
  },
  rolePillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  rolePillTextActive: {
    color: '#C97B6A',
  },
  rolePillTextInactive: {
    color: '#2B211D',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#A8423A',
    marginTop: 16,
  },
  ctaButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
  },
  ctaButtonEnabled: {
    backgroundColor: '#C97B6A',
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(201,123,106,0.4)',
  },
  ctaButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
