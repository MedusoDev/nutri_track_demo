import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Icon } from '../components/Icon';
import {
  EditSheet,
  MacroDot,
  Overline,
  Press,
  PrimaryButton,
  Segmented,
} from '../components/kit';
import { useApp } from '../state/AppContext';
import { useNav } from '../state/nav';
import { fonts, leaf, leafFlipped, useColors } from '../theme';
import { addDays, fromDateKey, toDateKey } from '../utils/date';
import {
  dayStatus,
  entriesOn,
  streakDays,
  sumNutrition,
} from '../utils/nutrition';
import { LB_PER_KG } from '../utils/plan';

const fmt = (x: number) => Math.round(x).toLocaleString('en-US');
const short = (key: string) =>
  fromDateKey(key).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

/** Smooth line through the points (Catmull-Rom to Bézier). */
function smooth(points: [number, number][]) {
  if (points.length === 0) {
    return '';
  }
  let d = `M${points[0][0]} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(
      1,
    )} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function HistoryScreen() {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const chartW = width - 40;
  const goal = state.goals.calories;
  const lb = state.units === 'lb';

  const [range, setRange] = useState<'week' | 'month'>('week');
  const [weekEnd, setWeekEnd] = useState(today);
  const [month, setMonth] = useState(() => {
    const d = fromDateKey(today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightText, setWeightText] = useState('');

  const kcalOn = (date: string) =>
    sumNutrition(entriesOn(state.entries, date)).calories;
  const streak = streakDays(state.entries, today);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekEnd, i - 6));
  const monthDays = Array.from(
    { length: new Date(month.y, month.m + 1, 0).getDate() },
    (_, i) => toDateKey(new Date(month.y, month.m, i + 1)),
  );
  const days = range === 'week' ? weekDays : monthDays;
  const pastDays = days.filter(d => d <= today);
  const logged = pastDays.filter(d => kcalOn(d) > 0);
  const average = logged.length
    ? logged.reduce((s, d) => s + kcalOn(d), 0) / logged.length
    : 0;

  const canNext =
    range === 'week'
      ? weekEnd < today
      : new Date(month.y, month.m + 1, 1) <= fromDateKey(today);
  function move(dir: -1 | 1) {
    if (range === 'week') {
      const end = addDays(weekEnd, dir * 7);
      const next = end > today ? today : end;
      setWeekEnd(next);
      setSelected(next);
    } else {
      const d = new Date(month.y, month.m + dir, 1);
      setMonth({ y: d.getFullYear(), m: d.getMonth() });
      const last = toDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      setSelected(last > today ? today : last);
    }
  }

  const periodLabel =
    range === 'week'
      ? `${fromDateKey(weekDays[0]).getDate()} – ${short(weekDays[6])}`
      : new Date(month.y, month.m, 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

  const sel = sumNutrition(entriesOn(state.entries, selected));
  const selStatus = dayStatus(sel.calories, goal);
  const diff = sel.calories - goal;
  const badge =
    selStatus === 'missing'
      ? {
          text: selected > today ? 'Upcoming' : 'Not logged',
          bg: colors.sunken,
          fg: colors.ink3,
        }
      : diff > goal * 0.05
      ? { text: `${fmt(diff)} over`, bg: colors.accentSoft, fg: colors.accent }
      : selStatus === 'on'
      ? { text: 'On target', bg: colors.soft, fg: colors.primary }
      : { text: `${fmt(-diff)} under`, bg: colors.soft, fg: colors.primary };

  const weightDates = Object.keys(state.weights).sort();
  const latestOn = (date: string) => {
    const before = weightDates.filter(d => d <= date);
    return before.length ? state.weights[before[before.length - 1]] : undefined;
  };
  const weightPoints =
    range === 'week'
      ? Array.from({ length: 8 }, (_, i) =>
          latestOn(addDays(today, (i - 7) * 7)),
        )
      : pastDays
          .filter((_, i) => i % 5 === 0 || i === pastDays.length - 1)
          .map(latestOn);
  const known = weightPoints.filter((w): w is number => w !== undefined);
  const nowKg = latestOn(today);
  const show = (kg: number) =>
    lb ? Math.round(kg * LB_PER_KG) : kg.toFixed(1);
  const unit = lb ? 'lb' : 'kg';

  function saveWeight() {
    const value = parseFloat(weightText.replace(',', '.'));
    const kg = lb ? value / LB_PER_KG : value;
    if (!(kg >= 30 && kg <= 300)) {
      return;
    }
    dispatch({ type: 'setWeight', date: today, kg: Math.round(kg * 10) / 10 });
    setWeightOpen(false);
    nav.toast('Weight logged', `${show(kg)} ${unit} · ${short(today)}`);
  }

  const avg = (key: 'protein' | 'carbs' | 'fat') =>
    logged.length
      ? logged.reduce(
          (s, d) => s + sumNutrition(entriesOn(state.entries, d))[key],
          0,
        ) / logged.length
      : 0;
  const avgMacros = [
    {
      name: 'Protein',
      value: avg('protein'),
      goal: state.goals.protein,
      color: colors.protein,
    },
    {
      name: 'Carbs',
      value: avg('carbs'),
      goal: state.goals.carbs,
      color: colors.carbs,
    },
    {
      name: 'Fat',
      value: avg('fat'),
      goal: state.goals.fat,
      color: colors.fat,
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48, // the tab bar sits below the scroll; this is room for the raised "+"
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.pad, styles.head]}>
        <Text style={[styles.title, { color: colors.ink }]}>History</Text>
        <Segmented
          options={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          value={range}
          onChange={r => {
            setRange(r);
            setSelected(today);
            setWeekEnd(today);
            const d = fromDateKey(today);
            setMonth({ y: d.getFullYear(), m: d.getMonth() });
          }}
        />
      </View>
      <View style={styles.periodRow}>
        <Pressable
          onPress={() => move(-1)}
          style={styles.arrow}
          accessibilityLabel={`Previous ${range}`}
        >
          <Icon name="back" size={24} color={colors.ink} strokeWidth={1.5} />
        </Pressable>
        <Text style={[styles.period, { color: colors.ink }]}>
          {periodLabel}
        </Text>
        <Pressable
          onPress={() => canNext && move(1)}
          disabled={!canNext}
          style={[styles.arrow, !canNext && styles.disabled]}
          accessibilityLabel={`Next ${range}`}
        >
          <Icon name="forward" size={24} color={colors.ink} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={styles.pad}>
        <View style={styles.avgRow}>
          <Text style={[styles.avg, { color: colors.ink }]}>
            {logged.length ? fmt(average) : '–'}
          </Text>
          <Text style={[styles.avgLabel, { color: colors.ink2 }]}>
            kcal a day, on average
          </Text>
        </View>

        {range === 'week' ? (
          <WeekChart
            width={chartW}
            days={weekDays}
            values={weekDays.map(kcalOn)}
            goal={goal}
            today={today}
            selected={selected}
            onSelect={setSelected}
          />
        ) : (
          <MonthCalendar
            days={monthDays}
            firstWeekday={(new Date(month.y, month.m, 1).getDay() + 6) % 7}
            status={d =>
              d > today
                ? 'future'
                : d === today
                ? 'today'
                : dayStatus(kcalOn(d), goal)
            }
            selected={selected}
            onSelect={d => d <= today && setSelected(d)}
          />
        )}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.lineStrong },
          leaf(26, 6),
        ]}
      >
        <View style={styles.rowBetween}>
          <View>
            <Overline>
              {fromDateKey(selected).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </Overline>
            <Text style={styles.mt4}>
              <Text style={[styles.dayKcal, { color: colors.ink }]}>
                {fmt(sel.calories)}
              </Text>
              <Text style={[styles.dayUnit, { color: colors.ink2 }]}>
                {' '}
                kcal
              </Text>
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>
              {badge.text}
            </Text>
          </View>
        </View>
        <View style={styles.dayMacros}>
          <MacroDot
            color={colors.protein}
            label="P"
            value={`${sel.protein} g`}
          />
          <MacroDot color={colors.carbs} label="C" value={`${sel.carbs} g`} />
          <MacroDot color={colors.fat} label="F" value={`${sel.fat} g`} />
        </View>
        <Pressable
          onPress={() => nav.push({ name: 'day', date: selected })}
          style={styles.open}
          accessibilityRole="button"
        >
          <Text style={[styles.openLabel, { color: colors.primary }]}>
            Open the day
          </Text>
          <Icon
            name="forward"
            size={18}
            color={colors.primary}
            strokeWidth={1.5}
          />
        </Pressable>
      </View>

      {range === 'week' ? (
        <View style={[styles.pad, styles.duo]}>
          <View
            style={[
              styles.macroCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.lineStrong,
              },
            ]}
          >
            <Overline>Average macros</Overline>
            <View style={styles.avgList}>
              {avgMacros.map(m => (
                <View key={m.name}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.small, { color: colors.ink2 }]}>
                      {m.name}
                    </Text>
                    <Text style={[styles.macroAvg, { color: colors.ink }]}>
                      {Math.round(m.value)} g
                    </Text>
                  </View>
                  <View
                    style={[styles.track, { backgroundColor: colors.sunken }]}
                  >
                    <View
                      style={[
                        styles.fill,
                        {
                          backgroundColor: m.color,
                          width: `${Math.min(100, (m.value / m.goal) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View
            style={[
              styles.streakCard,
              { backgroundColor: colors.primary },
              leafFlipped(26, 6),
            ]}
          >
            <Icon
              name="streak"
              size={28}
              color={colors.onPrimary}
              strokeWidth={1.5}
            />
            <Text style={[styles.streak, { color: colors.onPrimary }]}>
              {streak}
            </Text>
            <Text style={[styles.small, { color: colors.onPrimary }]}>
              day streak
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.pad, styles.stats]}>
          {[
            {
              value: logged.filter(d => dayStatus(kcalOn(d), goal) === 'on')
                .length,
              of: logged.length,
              label: 'days on target',
            },
            { value: logged.length, of: pastDays.length, label: 'days logged' },
            { value: streak, label: 'day streak' },
          ].map((s, i) => (
            <View
              key={s.label}
              style={[
                styles.flex,
                i > 0 && [styles.statSep, { borderLeftColor: colors.line }],
              ]}
            >
              <Text>
                <Text style={[styles.stat, { color: colors.ink }]}>
                  {s.value}
                </Text>
                {s.of !== undefined && (
                  <Text style={[styles.statOf, { color: colors.ink3 }]}>
                    {' '}
                    / {s.of}
                  </Text>
                )}
              </Text>
              <Text style={[styles.statLabel, { color: colors.ink2 }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.pad, styles.weight]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.h2, { color: colors.ink }]}>
            {range === 'week' ? 'Weight, 8 weeks' : 'Weight this month'}
          </Text>
          {known.length > 1 && (
            <Text style={[styles.small, { color: colors.ink2 }]}>
              {known[known.length - 1] - known[0] > 0 ? '+' : '−'}
              {show(Math.abs(known[known.length - 1] - known[0]))} {unit}
            </Text>
          )}
        </View>
        {nowKg !== undefined && range === 'week' && (
          <Text style={styles.mt4}>
            <Text style={[styles.weightNow, { color: colors.ink }]}>
              {show(nowKg)}
            </Text>
            <Text style={[styles.small, { color: colors.ink2 }]}>
              {' '}
              {unit} today
            </Text>
          </Text>
        )}
        {known.length > 1 ? (
          <WeightChart
            width={chartW}
            height={range === 'week' ? 140 : 96}
            values={weightPoints}
          />
        ) : (
          <Text style={[styles.weightEmpty, { color: colors.ink2 }]}>
            Log your weight now and then to see the trend here.
          </Text>
        )}
        <Press
          onPress={() => {
            setWeightText(nowKg !== undefined ? String(show(nowKg)) : '');
            setWeightOpen(true);
          }}
          style={[styles.logWeight, { borderColor: colors.primary }]}
        >
          <Icon
            name="scale"
            size={20}
            color={colors.primary}
            strokeWidth={1.5}
          />
          <Text style={[styles.logWeightLabel, { color: colors.primary }]}>
            Log weight
          </Text>
        </Press>
      </View>

      <EditSheet
        visible={weightOpen}
        title="Log today's weight"
        onClose={() => setWeightOpen(false)}
      >
        <View style={styles.weightField}>
          <TextInput
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            accessibilityLabel={`Weight in ${unit}`}
            style={[
              styles.weightInput,
              { color: colors.ink, borderBottomColor: colors.line },
            ]}
          />
          <Text style={[styles.dayUnit, { color: colors.ink3 }]}>{unit}</Text>
        </View>
        <View style={styles.mt20}>
          <PrimaryButton label="Save" onPress={saveWeight} />
        </View>
      </EditSheet>
    </ScrollView>
  );
}

function WeekChart({
  width,
  days,
  values,
  goal,
  today,
  selected,
  onSelect,
}: {
  width: number;
  days: string[];
  values: number[];
  goal: number;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const colors = useColors();
  const BASE = 172;
  const H = 160;
  const max = Math.max(goal * 1.25, ...values) || 1;
  const slot = (width - 16) / 7;
  const y = (v: number) => BASE - (v / max) * H;
  const goalY = y(goal);
  const selIndex = days.indexOf(selected);
  return (
    <View style={styles.chart}>
      <Svg
        width={width}
        height={196}
        accessibilityLabel={`Calories per day against a goal of ${fmt(goal)}`}
      >
        {selIndex >= 0 && (
          <Rect
            x={8 + selIndex * slot}
            y={4}
            width={slot}
            height={168}
            rx={12}
            fill={colors.soft}
          />
        )}
        <Line
          x1={8}
          y1={goalY}
          x2={width - 8}
          y2={goalY}
          stroke={colors.ink3}
          strokeWidth={1.5}
          strokeDasharray="4 5"
        />
        <SvgText
          x={width - 8}
          y={goalY - 7}
          textAnchor="end"
          fontSize={11.5}
          fill={colors.ink2}
          fontFamily={fonts.sansSemiBold}
        >
          {`Goal ${fmt(goal)}`}
        </SvgText>
        {values.map((v, i) => {
          const isToday = days[i] === today;
          const over = v > goal * 1.05;
          const h = Math.max(v > 0 ? 6 : 0, BASE - y(v));
          return (
            <Rect
              key={days[i]}
              x={8 + i * slot + (slot - 28) / 2}
              y={BASE - h}
              width={28}
              height={h}
              rx={9}
              fill={
                isToday ? 'transparent' : over ? colors.accent : colors.primary
              }
              stroke={isToday ? colors.primary : 'transparent'}
              strokeWidth={1.5}
              strokeDasharray={isToday ? '4 4' : undefined}
            />
          );
        })}
        <Line
          x1={8}
          y1={BASE}
          x2={width - 8}
          y2={BASE}
          stroke={colors.line}
          strokeWidth={1.5}
        />
      </Svg>
      <View style={[styles.dayRow, { paddingHorizontal: 8 }]}>
        {days.map(d => {
          const date = fromDateKey(d);
          const on = d === selected;
          return (
            <Pressable
              key={d}
              onPress={() => onSelect(d)}
              style={styles.dayCol}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.dayName,
                  { color: on ? colors.ink : colors.ink3 },
                ]}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  { color: on ? colors.ink : colors.ink3 },
                ]}
              >
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type CellStatus = 'on' | 'under' | 'over' | 'missing' | 'future' | 'today';

function MonthCalendar({
  days,
  firstWeekday,
  status,
  selected,
  onSelect,
}: {
  days: string[];
  firstWeekday: number; // 0 = Monday
  status: (date: string) => CellStatus;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const colors = useColors();
  const cellStyle = (s: CellStatus) =>
    ({
      on: { backgroundColor: colors.primary },
      over: { backgroundColor: colors.accent },
      under: { backgroundColor: colors.soft },
      missing: {
        borderWidth: 1.5,
        borderStyle: 'dashed' as const,
        borderColor: colors.line,
      },
      future: { opacity: 0.55 },
      today: { borderWidth: 2, borderColor: colors.primary },
    }[s]);
  const textColor = (s: CellStatus) =>
    s === 'on'
      ? colors.onPrimary
      : s === 'over'
      ? colors.onAccent
      : s === 'missing' || s === 'future'
      ? colors.ink3
      : colors.ink;
  const cells: (string | null)[] = [...Array(firstWeekday).fill(null), ...days];
  return (
    <View style={styles.calendar}>
      <View style={styles.calRow}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => (
          <Overline key={i} style={styles.calHead}>
            {h}
          </Overline>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((d, i) => {
          if (!d) {
            return <View key={`b${i}`} style={styles.cellBox} />;
          }
          const s = status(d);
          return (
            <View key={d} style={styles.cellBox}>
              <Pressable
                onPress={() => onSelect(d)}
                accessibilityLabel={`${short(d)}, ${s}`}
                style={[
                  styles.cell,
                  cellStyle(s),
                  d === selected && { borderWidth: 2, borderColor: colors.ink },
                ]}
              >
                <Text style={[styles.cellText, { color: textColor(s) }]}>
                  {fromDateKey(d).getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        {[
          { label: 'On target', style: { backgroundColor: colors.primary } },
          {
            label: 'Under',
            style: {
              backgroundColor: colors.soft,
              borderWidth: 1,
              borderColor: colors.line,
            },
          },
          { label: 'Over', style: { backgroundColor: colors.accent } },
          {
            label: 'Not logged',
            style: {
              borderWidth: 1.5,
              borderStyle: 'dashed' as const,
              borderColor: colors.ink3,
            },
          },
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendBox, l.style]} />
            <Text style={[styles.legendText, { color: colors.ink2 }]}>
              {l.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function WeightChart({
  width,
  height,
  values,
}: {
  width: number;
  height: number;
  values: (number | undefined)[];
}) {
  const colors = useColors();
  const pts = values
    .map((v, i) => [i, v] as const)
    .filter((p): p is readonly [number, number] => p[1] !== undefined);
  const nums = pts.map(p => p[1]);
  const min = Math.min(...nums) - 0.4;
  const max = Math.max(...nums) + 0.4;
  const step = (width - 28) / Math.max(1, values.length - 1);
  const bottom = height - 6;
  const P: [number, number][] = pts.map(([i, v]) => [
    14 + i * step,
    14 + ((max - v) / (max - min)) * (bottom - 28),
  ]);
  const line = smooth(P);
  const last = P[P.length - 1];
  const area = `${line} L${last[0].toFixed(1)} ${bottom} L${P[0][0].toFixed(
    1,
  )} ${bottom} Z`;
  return (
    <Svg
      width={width}
      height={height}
      style={styles.mt8}
      accessibilityLabel="Weight trend"
    >
      <Path d={area} fill={colors.soft} />
      <Path
        d={line}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {P.map((p, i) => (
        <Circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === P.length - 1 ? 6 : 3}
          fill={i === P.length - 1 ? colors.primary : colors.bg}
          stroke={colors.primary}
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 20,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -0.7,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingLeft: 8,
    paddingRight: 12,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  period: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  avg: {
    fontFamily: fonts.display,
    fontSize: 52,
    letterSpacing: -1,
  },
  avgLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  chart: {
    marginTop: 12,
  },
  dayRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  dayCol: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12.5,
  },
  dayNum: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  calendar: {
    marginTop: 18,
  },
  calRow: {
    flexDirection: 'row',
  },
  calHead: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 6,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellBox: {
    width: `${100 / 7}%`,
    padding: 3,
  },
  cell: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(14, 4),
  },
  cellText: {
    fontFamily: fonts.display,
    fontSize: 17,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 14,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    ...leaf(5, 2),
  },
  legendText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  card: {
    marginTop: 14,
    marginHorizontal: 20,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 8,
    borderWidth: 1.5,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
  mt20: {
    marginTop: 20,
  },
  dayKcal: {
    fontFamily: fonts.display,
    fontSize: 38,
  },
  dayUnit: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
  },
  badge: {
    height: 30,
    paddingHorizontal: 12,
    justifyContent: 'center',
    ...leaf(15, 4),
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12.5,
  },
  dayMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  open: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    marginTop: 4,
  },
  openLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  duo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  macroCard: {
    flex: 1.5,
    padding: 16,
    borderWidth: 1.5,
    borderRadius: 22,
  },
  avgList: {
    marginTop: 12,
    gap: 10,
  },
  small: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  macroAvg: {
    fontFamily: fonts.display,
    fontSize: 16,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  streakCard: {
    flex: 1,
    padding: 16,
  },
  streak: {
    marginTop: 10,
    fontFamily: fonts.display,
    fontSize: 44,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 22,
  },
  statSep: {
    paddingLeft: 14,
    borderLeftWidth: 1,
  },
  stat: {
    fontFamily: fonts.display,
    fontSize: 34,
  },
  statOf: {
    fontFamily: fonts.display,
    fontSize: 15,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  weight: {
    marginTop: 26,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  weightNow: {
    fontFamily: fonts.display,
    fontSize: 40,
  },
  weightEmpty: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 14.5,
  },
  logWeight: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingLeft: 12,
    paddingRight: 16,
    borderWidth: 1.5,
    ...leaf(22, 8),
  },
  logWeightLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  weightField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 18,
  },
  weightInput: {
    minWidth: 140,
    fontFamily: fonts.display,
    fontSize: 52,
    padding: 0,
    borderBottomWidth: 1.5,
  },
});
