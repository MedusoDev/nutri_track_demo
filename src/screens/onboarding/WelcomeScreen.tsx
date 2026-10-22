// Section 02: first screen after the splash. The logo keeps swaying on top of a cream sheet.
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPlate } from '../../components/AnimatedPlate';
import { Display, Press, PrimaryButton } from '../../components/kit';
import { palettes, fixed, fonts } from '../../theme';

const c = palettes.light; // Welcome is always light on the dark green background

interface Props {
  onGetStarted: () => void;
  onLogIn: () => void;
}

export function WelcomeScreen({ onGetStarted, onLogIn }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 30 }]}>
        <AnimatedPlate size={200} intro={false} />
        <Text style={styles.wordmark}>
          <Text style={{ color: fixed.leafGreen }}>Nutri</Text>
          <Text style={{ color: fixed.cream }}> Track</Text>
        </Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 34 }]}>
        <Display size={36} style={{ color: c.ink }}>
          Know what's on your plate.
        </Display>
        <Text style={styles.lead}>
          Calories and macros in a few taps, with a calm daily view. No guilt, just a clear picture.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton label="Get started" arrow onPress={onGetStarted} />
          <Press onPress={onLogIn} style={styles.secondary}>
            <Text style={styles.secondaryLabel}>I already have an account</Text>
          </Press>
          <Text style={styles.legal}>
            By continuing you agree to the <Text style={styles.link}>Terms</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: fixed.splash,
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: 6,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -0.8,
  },
  sheet: {
    minHeight: 410,
    backgroundColor: c.bg,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 10,
    paddingTop: 34,
    paddingHorizontal: 24,
  },
  lead: {
    marginTop: 12,
    maxWidth: 320,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    color: c.ink2,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: 24,
    gap: 10,
  },
  secondary: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15.5,
    color: c.ink,
  },
  legal: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 12,
    color: c.ink3,
  },
  link: {
    color: c.primary,
    textDecorationLine: 'underline',
  },
});
