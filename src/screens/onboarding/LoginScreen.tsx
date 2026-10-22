// Section 02: log in for people who already have an account (demo: no real backend).
import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import {
  BackButton,
  Body,
  Display,
  ErrorText,
  GhostButton,
  LineField,
  OrDivider,
  PrimaryButton,
  SsoButton,
} from '../../components/kit';
import { PlateLogo } from '../../components/Logo';
import { fonts, useColors } from '../../theme';

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Props {
  onBack: () => void;
  onLoggedIn: () => void;
  onForgot: () => void;
  onGetStarted: () => void;
}

export function LoginScreen({ onBack, onLoggedIn, onForgot, onGetStarted }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleLogIn() {
    Keyboard.dismiss();
    if (!EMAIL_RE.test(email)) {
      setError('email');
      return;
    }
    // Demo rule: any password with 8+ characters works.
    if (password.length < 8) {
      setError('password');
      return;
    }
    onLoggedIn();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PlateLogo size={64} tone="light" detailed={false} />
        <Display size={36} style={styles.title}>
          Welcome back
        </Display>
        <Body style={styles.lead}>Log in to pick up your streak where you left it.</Body>

        <View style={styles.sso}>
          <SsoButton provider="apple" onPress={onLoggedIn} />
          <SsoButton provider="google" onPress={onLoggedIn} />
        </View>
        <OrDivider />

        <LineField
          label="Email"
          value={email}
          onChangeText={text => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          error={error === 'email'}
        />
        {error === 'email' && <ErrorText>That email looks incomplete.</ErrorText>}
        <LineField
          label="Password"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          error={error === 'password'}
          style={styles.gap}
          right={
            <Pressable
              onPress={() => setShowPassword(v => !v)}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name="eye" size={22} color={colors.ink3} strokeWidth={1.5} />
            </Pressable>
          }
        />
        {error === 'password' && <ErrorText>That password doesn't match. Try again or reset it.</ErrorText>}
        <View style={styles.forgot}>
          <GhostButton label="Forgot password?" onPress={onForgot} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton label="Log in" onPress={handleLogIn} />
        <Pressable onPress={onGetStarted} style={styles.newHere} accessibilityRole="button">
          <Text style={[styles.newHereText, { color: colors.ink2 }]}>
            New here? <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.primary }}>Get started</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 13,
    paddingBottom: 24,
  },
  title: {
    marginTop: 14,
  },
  lead: {
    marginTop: 8,
  },
  sso: {
    gap: 10,
    marginTop: 24,
  },
  gap: {
    marginTop: 12,
  },
  eye: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgot: {
    alignItems: 'flex-end',
  },
  footer: {
    paddingHorizontal: 24,
    gap: 4,
  },
  newHere: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newHereText: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
  },
});
