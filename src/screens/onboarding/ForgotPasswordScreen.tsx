// Section 02: Login -> Forgot password -> Link sent (with a 30 s cooldown to send again).
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import {
  BackButton,
  Body,
  Display,
  ErrorText,
  GhostButton,
  LineField,
  Overline,
  PrimaryButton,
} from '../../components/kit';
import { leaf, useColors } from '../../theme';
import { EMAIL_RE } from './LoginScreen';

const COOLDOWN = 30;

export function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const ok = EMAIL_RE.test(email);
  const bad = email.length > 3 && !ok;

  function startCooldown() {
    setSecondsLeft(COOLDOWN);
    if (timer.current) {
      clearInterval(timer.current);
    }
    timer.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1 && timer.current) {
          clearInterval(timer.current);
        }
        return Math.max(0, s - 1);
      });
    }, 1000);
  }

  useEffect(
    () => () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    },
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>

      {!sent ? (
        <View style={styles.content}>
          <Overline>Account</Overline>
          <Display size={36} style={styles.title}>
            Reset your password
          </Display>
          <Body style={styles.lead}>
            Type the email you signed up with. We'll send a link to set a new password.
          </Body>
          <LineField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            error={bad}
            style={styles.field}
          />
          {bad && <ErrorText>That email looks incomplete.</ErrorText>}
          <Body style={[styles.note, { color: colors.ink3 }]}>
            Signed up with Apple or Google? You don't have a password here. Go back and use that button
            instead.
          </Body>
        </View>
      ) : (
        <View style={[styles.content, styles.sentContent]}>
          <View style={[styles.mailIcon, { backgroundColor: colors.soft }]}>
            <Icon name="mail" size={34} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Display size={36} style={styles.sentTitle}>
            Check your email
          </Display>
          <Body style={styles.lead}>
            If there's an account for <Body style={{ color: colors.ink }}>{email}</Body>, a reset link is on
            its way. It works for 30 minutes.
          </Body>
          <Body style={[styles.note, styles.smallGap, { color: colors.ink3 }]}>
            Not there? Check spam, or wait a minute and send it again.
          </Body>
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {!sent ? (
          <PrimaryButton
            label="Send reset link"
            disabled={!ok}
            onPress={() => {
              setSent(true);
              startCooldown();
            }}
          />
        ) : (
          <>
            <PrimaryButton label="Back to log in" onPress={onBack} />
            <GhostButton
              label={secondsLeft > 0 ? `Send again in ${secondsLeft} s` : 'Send it again'}
              color={secondsLeft > 0 ? colors.ink3 : colors.primary}
              disabled={secondsLeft > 0}
              onPress={startCooldown}
            />
          </>
        )}
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 13,
  },
  sentContent: {
    paddingTop: 47,
  },
  title: {
    marginTop: 8,
  },
  lead: {
    marginTop: 10,
  },
  field: {
    marginTop: 28,
  },
  note: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  smallGap: {
    marginTop: 10,
  },
  mailIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(36, 10),
  },
  sentTitle: {
    marginTop: 22,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 4,
  },
});
