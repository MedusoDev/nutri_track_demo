// Animated version of the logo (motion spec: new-design/01-splash/SplashMotion.dc.html).
// Each layer is its own view so RN can rotate the leaves around the plate centre
// with the native driver: back of the plate -> 3 leaves -> front of the plate.
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { fixed } from '../theme';
import { Leaf, LEAVES, PLATE_BODY, PLATE_FOOT } from './Logo';

const GROW = Easing.bezier(0.2, 0.8, 0.2, 1);

// Start delay, opening angle, sway amplitude and phase for each leaf (same order as LEAVES).
const MOTION = [
  { delay: 700, open: 24, amp: 5, phase: 0.15 },
  { delay: 950, open: -24, amp: 5, phase: 0.8 },
  { delay: 1200, open: 0, amp: 3.5, phase: 0.5 },
];

interface Props {
  size: number;
  tone?: 'dark' | 'light';
  /** Plate rises and leaves grow out of it. */
  intro?: boolean;
  /** Leaves keep swaying (2.8 s loop). */
  sway?: boolean;
  /** Start delay of each leaf in ms (protein, fat, carbs). */
  leafDelays?: number[];
  shadow?: boolean;
  reducedMotion?: boolean;
}

/** Samples -amp * cos(2π(t + phase)) so a linear 0..1 clock becomes a smooth sway. */
function swayCurve(amp: number, phase: number) {
  const inputRange = Array.from({ length: 17 }, (_, i) => i / 16);
  const outputRange = inputRange.map(t => -amp * Math.cos(2 * Math.PI * (t + phase)));
  return { inputRange, outputRange };
}

export function AnimatedPlate({
  size,
  tone = 'dark',
  intro = true,
  sway = true,
  leafDelays = MOTION.map(m => m.delay),
  shadow = true,
  reducedMotion = false,
}: Props) {
  const animate = intro && !reducedMotion;
  const plate = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const shadowIn = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const fade = useRef(new Animated.Value(reducedMotion && intro ? 0 : 1)).current;
  const grow = useRef(LEAVES.map(() => new Animated.Value(animate ? 0 : 1))).current;
  const clock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      // Reduced motion: final pose, fade only.
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      return;
    }
    if (intro) {
      Animated.parallel([
        Animated.timing(plate, { toValue: 1, duration: 600, easing: GROW, useNativeDriver: true }),
        Animated.timing(shadowIn, {
          toValue: 1,
          duration: 600,
          delay: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        ...grow.map((value, i) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 900,
            delay: leafDelays[i],
            easing: GROW,
            useNativeDriver: true,
          }),
        ),
      ]).start();
    }
    if (sway) {
      const loop = Animated.loop(
        Animated.timing(clock, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }),
      );
      loop.start();
      return () => loop.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mode, delays are constants
  }, [intro, sway, reducedMotion, plate, shadowIn, fade, grow, clock]);

  const k = size / 200; // px per viewBox unit
  const plateColor = tone === 'dark' ? fixed.cream : '#2F4A33';
  const plateTop = tone === 'dark' ? fixed.plateTop : fixed.plateTopLight;
  const leafColors = tone === 'dark' ? fixed.leavesOnDark : fixed.leavesOnLight;

  const plateStyle = {
    opacity: plate,
    transform: [{ translateY: plate.interpolate({ inputRange: [0, 1], outputRange: [16 * k, 0] }) }],
  };

  return (
    <Animated.View style={{ width: size, height: size, opacity: fade }}>
      {shadow && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: shadowIn,
              transform: [{ scaleX: shadowIn.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Ellipse cx={100} cy={182} rx={56} ry={5} fill="#000" fillOpacity={tone === 'dark' ? 0.3 : 0.1} />
          </Svg>
        </Animated.View>
      )}

      <Animated.View style={[StyleSheet.absoluteFill, plateStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Ellipse cx={100} cy={140} rx={64} ry={10} fill={plateTop} stroke={plateColor} strokeWidth={3} />
        </Svg>
      </Animated.View>

      {LEAVES.map((leaf, i) => {
        const m = MOTION[i];
        const g = grow[i];
        // rotation = rest + opening (upright -> rest while growing) + sway
        const rotation = Animated.add(
          Animated.add(
            new Animated.Value(leaf.rest),
            g.interpolate({ inputRange: [0, 0.6, 1], outputRange: [m.open, 0, 0] }),
          ),
          sway && !reducedMotion ? clock.interpolate(swayCurve(m.amp, m.phase)) : new Animated.Value(0),
        );
        return (
          <Animated.View
            key={leaf.key}
            pointerEvents="none"
            style={[
              styles.leafLayer,
              {
                width: size,
                height: size,
                top: (146 - 100) * k, // the view's centre sits on the pivot (100, 146)
                opacity: g.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    }),
                  },
                  {
                    scale: g.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0.05 * leaf.scale, 1.06 * leaf.scale, leaf.scale],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={size} height={size} viewBox="0 46 200 200">
              <G transform="translate(100 146)">
                <Leaf color={leafColors[leaf.key]} stem={plateColor} />
              </G>
            </Svg>
          </Animated.View>
        );
      })}

      <Animated.View style={[StyleSheet.absoluteFill, plateStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Path d={PLATE_BODY} fill={plateColor} />
          <Path d={PLATE_FOOT} fill={plateColor} />
          <Path
            d="M46 147C62 152 80 154 100 154"
            stroke={tone === 'dark' ? fixed.splash : '#fff'}
            strokeOpacity={tone === 'dark' ? 0.18 : 0.28}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  leafLayer: {
    position: 'absolute',
    left: 0,
  },
});

