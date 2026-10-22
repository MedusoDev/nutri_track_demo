// Hero of Today: the three logo leaves (no plate), each one filling with its macro.
// Protein, fat and carbs fill from the base to the tip in proportion eaten / goal.
// They grow in when the screen opens and keep swaying gently, like on the splash.
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fixed } from '../theme';
import { FillShape } from './FillShape';
import { LEAF_PATH, LEAVES } from './Logo';

const K = 1.05; // px per logo unit
const W = 170;
const H = 112;
const STEM = 12; // logo units between the pivot and the leaf base

// Same motion as the splash: start delay, sway amplitude and phase per leaf (LEAVES order).
const MOTION = [
  { delay: 0, amp: 5, phase: 0.15 },
  { delay: 160, amp: 5, phase: 0.8 },
  { delay: 320, amp: 3.5, phase: 0.5 },
];

function swayCurve(rest: number, amp: number, phase: number) {
  const inputRange = Array.from({ length: 17 }, (_, i) => i / 16);
  const outputRange = inputRange.map(
    t => `${rest - amp * Math.cos(2 * Math.PI * (t + phase))}deg`,
  );
  return { inputRange, outputRange };
}

interface Props {
  /** 0..1 eaten / goal of each macro. */
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroLeaves({ protein, carbs, fat }: Props) {
  const pct = { protein, carbs, fat };
  const colors = fixed.leavesOnDark;
  const clock = useRef(new Animated.Value(0)).current;
  const grow = useRef(LEAVES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const sway = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: 4200, // slower than the splash (2.8 s): Today should feel calm
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    sway.start();
    Animated.stagger(
      240,
      grow.map(g =>
        Animated.timing(g, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
          useNativeDriver: true,
        }),
      ),
    ).start();
    return () => sway.stop();
  }, [clock, grow]);

  const label = `Protein ${Math.round(
    protein * 100,
  )} percent, carbs ${Math.round(carbs * 100)} percent, fat ${Math.round(
    fat * 100,
  )} percent of today's goals`;

  return (
    <View style={styles.box} accessibilityLabel={label}>
      {LEAVES.map((l, i) => {
        const w = 50 * K * l.scale;
        const leafH = 80 * K * l.scale;
        const stemH = STEM * K * l.scale;
        const h = leafH + stemH; // the view runs from the leaf tip down to the pivot
        const m = MOTION[i];
        const g = grow[i];
        return (
          <Animated.View
            key={l.key}
            style={[
              styles.leaf,
              {
                width: w,
                height: h,
                left: W / 2 - w / 2,
                top: H - h,
                opacity: g.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 1, 1],
                }),
                // rotate and scale around the bottom centre (where the stems meet)
                transform: [
                  { translateY: h / 2 },
                  {
                    rotate: clock.interpolate(
                      swayCurve(l.rest, m.amp, m.phase),
                    ),
                  },
                  {
                    scale: g.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0.05, 1.06, 1],
                    }),
                  },
                  { translateY: -h / 2 },
                ],
              },
            ]}
          >
            <FillShape
              width={w}
              height={leafH}
              viewBox="-25 -78 50 80"
              path={LEAF_PATH}
              top={-76}
              bottom={0}
              pct={Math.min(1, Math.max(0, pct[l.key]))}
              fill={colors[l.key]}
              emptyFill="rgba(246,241,231,0.08)"
              stroke="rgba(246,241,231,0.55)"
              strokeWidth={1.6}
            >
              <Path
                d="M0-2C1-26 1.5-50 2-72M1-34-12-45M1.2-34 12-44M1.5-52-8-60M1.6-52 8-59"
                fill="none"
                stroke="#203526"
                strokeOpacity={0.45}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </FillShape>
            <Svg width={w} height={stemH} viewBox={`-25 0 50 ${STEM}`}>
              <Path
                d={`M0 0V${STEM}`}
                stroke="rgba(246,241,231,0.7)"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: W,
    height: H,
  },
  leaf: {
    position: 'absolute',
  },
});
