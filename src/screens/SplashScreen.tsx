// Section 01: loading screen. Plate rises, three macro leaves sprout, the name fades in
// and three macro-coloured dots pulse until the data is ready.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { AnimatedPlate } from '../components/AnimatedPlate';
import { fixed, fonts, leaf } from '../theme';

const RISE = Easing.bezier(0.2, 0.8, 0.2, 1);
const DOT_COLORS = [fixed.leavesOnDark.protein, fixed.leavesOnDark.carbs, fixed.leavesOnDark.fat];

interface Props {
  /** Data is loaded and the minimum time passed (App decides: never before 1.7 s). */
  ready: boolean;
  onFinish: () => void;
}

export function SplashScreen({ ready, onFinish }: Props) {
  const [reduced, setReduced] = useState<boolean | null>(null);
  const wordmark = useRef(new Animated.Value(0)).current;
  const dotsIn = useRef(new Animated.Value(0)).current;
  const dots = useRef(DOT_COLORS.map(() => new Animated.Value(0))).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => setReduced(false));
  }, []);

  useEffect(() => {
    if (reduced === null) {
      return;
    }
    Animated.timing(wordmark, {
      toValue: 1,
      duration: reduced ? 400 : 600,
      delay: reduced ? 200 : 1700,
      easing: RISE,
      useNativeDriver: true,
    }).start();
    Animated.timing(dotsIn, {
      toValue: 1,
      duration: 400,
      delay: reduced ? 400 : 2300,
      useNativeDriver: true,
    }).start();
    if (reduced) {
      return;
    }
    // Dots pulse in sequence, 160 ms apart, 1200 ms loop.
    const loops = dots.map((dot, i) =>
      Animated.sequence([
        Animated.delay(2300 + i * 160),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 840, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ),
      ]),
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [reduced, wordmark, dotsIn, dots]);

  // Exit: 300 ms cross-fade into the next screen.
  useEffect(() => {
    if (ready) {
      Animated.timing(exit, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onFinish());
    }
  }, [ready, exit, onFinish]);

  return (
    <Animated.View
      style={[styles.container, { opacity: exit }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Nutri Track"
    >
      {reduced !== null && <AnimatedPlate size={280} reducedMotion={reduced} />}
      {reduced === null && <View style={styles.placeholder} />}
      <Animated.View
        style={{
          opacity: wordmark,
          transform: [{ translateY: wordmark.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <Text style={styles.wordmark}>
          <Text style={{ color: fixed.leafGreen }}>Nutri</Text>
          <Text style={{ color: fixed.cream }}> Track</Text>
        </Text>
      </Animated.View>
      <Animated.View style={[styles.dots, { opacity: dotsIn }]}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: DOT_COLORS[i],
                opacity: reduced ? 0.7 : dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
              },
            ]}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: fixed.splash,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  placeholder: {
    width: 280,
    height: 280,
  },
  wordmark: {
    marginTop: 10,
    fontFamily: fonts.display,
    fontSize: 46,
    letterSpacing: -1.1,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 26,
  },
  dot: {
    width: 8,
    height: 8,
    ...leaf(5, 2),
  },
});
