// A shape (leaf, water drop) that fills from the bottom with an animated level.
// No SVG clip paths (on Android they do not redraw when the level changes): a full-size
// window with overflow hidden slides down to the surface while the fill inside slides
// back up by the same amount, so the fill stays put and only its top edge moves.
// Both moves are transforms, so the level runs on the native driver (no JS work per frame).
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  width: number;
  height: number;
  viewBox: string; // "minX minY w h"
  path: string;
  /** 0..1 of the shape that is filled. */
  pct: number;
  /** Shape spans these viewBox y values (bottom is where the fill starts). */
  top: number;
  bottom: number;
  fill: string;
  /** Drawn under the fill (empty part). */
  emptyFill?: string;
  /** Drawn over everything. */
  stroke?: string;
  strokeWidth?: number;
  /** "spring" sloshes a little when the level rises (water); "ease" is the 700 ms design curve. */
  motion?: 'ease' | 'spring';
  /**
   * Water surface: a small wave keeps rolling on top of the level. Pass the colour of
   * whatever is behind the shape (the wave "cuts" the top of the fill with it).
   */
  wave?: string;
  /** Extra SVG drawn on top (leaf veins, shine). */
  children?: ReactNode;
  accessibilityLabel?: string;
}

export function FillShape({
  width,
  height,
  viewBox,
  path,
  pct,
  top,
  bottom,
  fill,
  emptyFill = 'none',
  stroke,
  strokeWidth = 1.5,
  motion = 'ease',
  wave,
  children,
  accessibilityLabel,
}: Props) {
  const [, minY, , vbH] = viewBox.split(' ').map(Number);
  const scale = height / vbH;
  // Distance in px from the top of the box down to the water / fill surface.
  const surfacePx = (p: number) =>
    height -
    (minY + vbH - bottom + Math.min(1, Math.max(0, p)) * (bottom - top)) *
      scale;

  const level = useRef(new Animated.Value(surfacePx(pct))).current;
  const back = useRef(Animated.multiply(level, -1)).current;
  useEffect(() => {
    const to = surfacePx(pct);
    const animation =
      motion === 'spring'
        ? Animated.spring(level, {
            toValue: to,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          })
        : Animated.timing(level, {
            toValue: to,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- surfacePx only depends on the static props
  }, [pct, motion, level]);

  // Rolling wave: one period is the shape width, so shifting by `width` loops seamlessly.
  const roll = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const hasWave = !!wave && pct > 0;
  useEffect(() => {
    if (!hasWave) {
      return;
    }
    const rolling = Animated.loop(
      Animated.timing(roll, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const bobbing = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    rolling.start();
    bobbing.start();
    return () => {
      rolling.stop();
      bobbing.stop();
    };
  }, [hasWave, roll, bob]);

  const waveH = Math.max(3, height * 0.09);
  // Two periods of a sine; the area ABOVE the curve is painted with the background colour.
  const wavePath = (() => {
    const w = width * 2;
    const steps = 32;
    let d = `M0 0 L0 ${(waveH / 2).toFixed(2)}`;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const y = waveH / 2 + (waveH / 2) * Math.sin((x / width) * 2 * Math.PI);
      d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return `${d} L${w} 0 Z`;
  })();

  return (
    <View style={{ width, height }} accessibilityLabel={accessibilityLabel}>
      <Svg
        width={width}
        height={height}
        viewBox={viewBox}
        style={StyleSheet.absoluteFill}
      >
        <Path d={path} fill={emptyFill} />
      </Svg>
      <Animated.View
        style={[
          styles.window,
          { width, height, transform: [{ translateY: level }] },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: back }] }}>
          <Svg width={width} height={height} viewBox={viewBox}>
            <Path d={path} fill={fill} />
          </Svg>
        </Animated.View>
        {hasWave && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.wave,
              {
                width: width * 2,
                height: waveH,
                transform: [
                  {
                    translateX: roll.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -width],
                    }),
                  },
                  {
                    translateY: bob.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-0.6, 0.8],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={width * 2} height={waveH}>
              <Path d={wavePath} fill={wave} />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>
      <Svg
        width={width}
        height={height}
        viewBox={viewBox}
        style={StyleSheet.absoluteFill}
      >
        {stroke && (
          <Path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        )}
        {children}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  window: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    left: 0,
    top: -1,
  },
});
