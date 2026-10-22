// Sky behind a meal row: its colours, the sun or the moon on the day arc and a few clouds or
// stars follow the time the meal was eaten (07:30 = sun low on the left, 12:30 = sun at the
// top, 16:00 = sun going down, 21:00 = moon). Kept calm on purpose: nothing moves.
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type Phase = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk';

// Soft, low-saturation skies so the row still reads as part of the card.
const SKIES: Record<Phase, { top: string; bottom: string; darkText: boolean }> =
  {
    night: { top: '#2C3858', bottom: '#414E70', darkText: false },
    dawn: { top: '#F0C6A2', bottom: '#DCE7EE', darkText: true },
    morning: { top: '#B5D8EF', bottom: '#E1EFF7', darkText: true },
    midday: { top: '#9ECFEF', bottom: '#D9ECF7', darkText: true },
    afternoon: { top: '#E6B38A', bottom: '#F1D6BE', darkText: true },
    dusk: { top: '#4D5276', bottom: '#8F7A8C', darkText: false },
  };

function minutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function phaseOf(time: string): Phase {
  const t = minutes(time) / 60;
  if (t < 5 || t >= 20) {
    return 'night';
  }
  if (t < 7) {
    return 'dawn';
  }
  if (t < 11) {
    return 'morning';
  }
  if (t < 15) {
    return 'midday';
  }
  if (t < 18) {
    return 'afternoon';
  }
  return 'dusk';
}

/** True when the meal's text should be light (the sky behind it is dark). */
export function skyIsDark(time: string) {
  return !SKIES[phaseOf(time)].darkText;
}

interface Props {
  time: string; // "HH:MM"
  /** Softer sky for the dark theme. */
  dim?: boolean;
}

export function MealSky({ time, dim }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) {
      setSize({ w: width, h: height });
    }
  };

  const phase = phaseOf(time);
  const sky = SKIES[phase];
  const t = minutes(time) / 60;
  const isDay = t >= 6 && t < 18;
  // 06:00 -> 18:00 is the sun's half circle, 18:00 -> 06:00 the moon's.
  const progress = isDay ? (t - 6) / 12 : ((t - 18 + 24) % 24) / 12;

  const { w, h } = size;
  const left = w * 0.06;
  const right = w * 0.94;
  const base = h - 6;
  const lift = h * 0.7;
  const x = left + (right - left) * progress;
  const y = base - Math.sin(Math.PI * progress) * lift;
  // The arc is the same sine the sun moves on, so the sun always sits on the dashed line.
  const arc = Array.from({ length: 25 }, (_, i) => {
    const p = i / 24;
    const px = left + (right - left) * p;
    const py = base - Math.sin(Math.PI * p) * lift;
    return `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ');
  const id = `sky-${phase}`;
  const sunColor = phase === 'afternoon' ? '#E9965A' : '#F2B84B';

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      pointerEvents="none"
    >
      {/* The colours draw at once (no size needed), so switching tabs shows the sky instantly. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} />
            <Stop offset="1" stopColor={sky.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
        {dim && (
          <Rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            fill="#000"
            fillOpacity={0.3}
          />
        )}
      </Svg>
      {w > 0 && (
        <>
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            <Path
              d={arc}
              fill="none"
              stroke={sky.darkText ? '#1F2A21' : '#F6F1E7'}
              strokeOpacity={sky.darkText ? 0.16 : 0.22}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
            {isDay ? (
              <Cloud
                x={w * 0.62}
                y={h * 0.16}
                size={40}
                warm={phase === 'afternoon'}
              />
            ) : (
              [
                [0.16, 0.3],
                [0.38, 0.2],
                [0.64, 0.38],
                [0.86, 0.24],
              ].map(([sx, sy], i) => (
                <Circle
                  key={i}
                  cx={w * sx}
                  cy={h * sy}
                  r={0.9}
                  fill="#F6F1E7"
                  fillOpacity={0.55}
                />
              ))
            )}
          </Svg>
          <View style={[styles.body, { left: x - 14, top: y - 14 }]}>
            <Svg width={28} height={28}>
              {isDay ? (
                <>
                  <Circle
                    cx={14}
                    cy={14}
                    r={12}
                    fill={sunColor}
                    fillOpacity={0.18}
                  />
                  <Circle cx={14} cy={14} r={6.5} fill={sunColor} />
                </>
              ) : (
                // crescent: a cream disc with a bite taken out
                <Path
                  d="M16 7 A7 7 0 1 0 16 21 A5.4 5.4 0 1 1 16 7 Z"
                  fill="#EFE9D8"
                  fillOpacity={0.9}
                />
              )}
            </Svg>
          </View>
        </>
      )}
    </View>
  );
}

function Cloud({
  x,
  y,
  size,
  warm,
}: {
  x: number;
  y: number;
  size: number;
  warm: boolean;
}) {
  const s = size;
  return (
    <Path
      d={`M${x + s * 0.18} ${y + s * 0.4} C${x + s * 0.02} ${y + s * 0.4} ${
        x + s * 0.04
      } ${y + s * 0.18} ${x + s * 0.22} ${y + s * 0.2}
          C${x + s * 0.26} ${y + s * 0.04} ${x + s * 0.5} ${y + s * 0.02} ${
        x + s * 0.56
      } ${y + s * 0.17}
          C${x + s * 0.7} ${y + s * 0.08} ${x + s * 0.9} ${y + s * 0.16} ${
        x + s * 0.86
      } ${y + s * 0.32}
          C${x + s * 0.98} ${y + s * 0.36} ${x + s * 0.94} ${y + s * 0.42} ${
        x + s * 0.84
      } ${y + s * 0.42} Z`}
      fill={warm ? '#FBEBDD' : '#FFFFFF'}
      fillOpacity={0.6}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
});
