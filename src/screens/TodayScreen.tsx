import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { FillShape } from '../components/FillShape';
import { Icon } from '../components/Icon';
import { MacroLeaves } from '../components/MacroLeaves';
import { MealSky, skyIsDark } from '../components/MealSky';
import { Press } from '../components/kit';
import { MEALS } from '../data/foods';
import { useApp } from '../state/AppContext';
import { useNav } from '../state/nav';
import {
  fixed,
  fonts,
  leaf,
  leafFlipped,
  overline,
  useColors,
  useIsDark,
} from '../theme';
import { Entry, MealType } from '../types';
import { addDays, fromDateKey } from '../utils/date';
import {
  entriesByMeal,
  entriesOn,
  streakDays,
  sumNutrition,
  mealForNow,
  timeOf,
} from '../utils/nutrition';

const fmt = (x: number) => Math.round(x).toLocaleString('en-US');

function greeting(hour: number) {
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/** "Wed · 21 Oct" */
function dateLabel(key: string) {
  const date = fromDateKey(key);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} · ${date.getDate()} ${month}`;
}

interface Props {
  /** The day shown: today on the tab, a past day when opened from History. */
  date: string;
  highlight: { meal: MealType; id: number } | null;
}

export function TodayScreen({ date, highlight }: Props) {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const { goals } = state;
  const isToday = date === today;

  const onLogFood = (meal?: MealType) =>
    nav.push({ name: 'logFood', meal: meal ?? mealForNow(), date });
  const onDeleteEntries = nav.deleted;

  const entries = entriesOn(state.entries, date);
  const totals = sumNutrition(entries);
  const water = state.water[date] ?? 0;
  const streak = streakDays(state.entries, today);
  const firstName = state.name.split(' ')[0] || 'there';

  const over = totals.calories > goals.calories;
  const empty = entries.length === 0;
  const left = Math.max(0, goals.calories - totals.calories);

  const heroNumber = over ? totals.calories - goals.calories : left;
  const heroLabel = over
    ? 'kcal over goal'
    : empty
    ? 'kcal for today'
    : 'kcal left';

  const loggedMeals = MEALS.filter(
    m => entriesByMeal(entries, m.key).length > 0,
  );
  const emptyMeals = MEALS.filter(
    m => entriesByMeal(entries, m.key).length === 0,
  );

  const yesterdayBreakfast = entriesByMeal(
    entriesOn(state.entries, addDays(date, -1)),
    'breakfast',
  );
  function copyYesterdayBreakfast() {
    const time = timeOf(new Date());
    yesterdayBreakfast.forEach((entry, i) =>
      dispatch({
        type: 'addEntry',
        entry: { ...entry, id: `${Date.now()}-${i}`, date, time },
      }),
    );
  }

  const macros = [
    {
      name: 'Protein',
      value: totals.protein,
      goal: goals.protein,
      color: colors.protein,
    },
    {
      name: 'Carbs',
      value: totals.carbs,
      goal: goals.carbs,
      color: colors.carbs,
    },
    { name: 'Fat', value: totals.fat, goal: goals.fat, color: colors.fat },
  ];

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: isToday ? 48 : insets.bottom + 24, // the tab bar sits below the scroll; this is room for the raised "+"
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.hero, paddingTop: insets.top + 16 },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            {!isToday && (
              <Pressable
                onPress={nav.pop}
                style={styles.heroBack}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Icon
                  name="back"
                  size={24}
                  color={fixed.cream}
                  strokeWidth={1.5}
                />
              </Pressable>
            )}
            <Text style={[overline, styles.heroDate]}>{dateLabel(date)}</Text>
            <Text style={styles.greeting}>
              {isToday
                ? `${greeting(new Date().getHours())}, ${firstName}`
                : fromDateKey(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                  })}
            </Text>
          </View>
          {isToday && streak > 0 && (
            <View
              style={styles.streak}
              accessibilityLabel={`${streak} day streak`}
            >
              <Icon
                name="streak"
                size={18}
                color={fixed.leafGreen}
                strokeWidth={1.5}
              />
              <Text style={styles.streakText}>
                {streak} {streak === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.heroMain}>
          <View>
            <Text
              style={[
                styles.bigNumber,
                { color: over ? fixed.overNumber : fixed.cream },
              ]}
            >
              <CountUp value={heroNumber} />
            </Text>
            <Text style={styles.bigLabel}>{heroLabel}</Text>
          </View>
          <View style={styles.heroLeaf}>
            <MacroLeaves
              protein={totals.protein / goals.protein}
              carbs={totals.carbs / goals.carbs}
              fat={totals.fat / goals.fat}
            />
          </View>
        </View>
        <Text style={styles.heroLine}>
          <CountUp value={totals.calories} /> eaten · {fmt(goals.calories)} goal
        </Text>
        {over && (
          <View style={styles.overNote}>
            <Text style={styles.overNoteText}>
              A big day. One day doesn't bend the trend; tomorrow starts fresh.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.macros}>
        {macros.map((m, i) => {
          const isOver = m.value > m.goal;
          return (
            <View
              key={m.name}
              style={[
                styles.macro,
                i > 0 && {
                  paddingLeft: 12,
                  borderLeftWidth: 1,
                  borderLeftColor: colors.line,
                },
              ]}
            >
              <View style={styles.dotRow}>
                <View style={[styles.dot, { backgroundColor: m.color }]} />
                <Text style={[styles.macroName, { color: colors.ink2 }]}>
                  {m.name}
                </Text>
              </View>
              <Text style={styles.macroValueRow}>
                <Text
                  style={[
                    styles.macroValue,
                    { color: isOver ? colors.accent : colors.ink },
                  ]}
                >
                  {m.value}
                </Text>
                <Text style={[styles.macroGoal, { color: colors.ink3 }]}>
                  {' '}
                  / {m.goal} g
                </Text>
              </Text>
              <GrowBar
                pct={Math.min(1, m.value / m.goal)}
                color={m.color}
                track={colors.sunken}
              />
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.water,
          { backgroundColor: colors.waterSoft, borderColor: colors.waterLine },
        ]}
      >
        <View style={styles.waterTop}>
          <View style={styles.waterInfo}>
            <WaterBadge pct={goals.water ? water / goals.water : 0} />
            <View>
              <Text style={[styles.waterTitle, { color: colors.ink }]}>
                Water
              </Text>
              <Text style={[styles.waterSub, { color: colors.ink2 }]}>
                <Text style={[styles.waterAmount, { color: colors.ink }]}>
                  {liters(water)}
                </Text>{' '}
                of {liters(goals.water)}
              </Text>
            </View>
          </View>
          <Press
            onPress={() =>
              dispatch({ type: 'setWater', date, glasses: water + 1 })
            }
            accessibilityLabel="Add one glass, 250 millilitres"
            style={[styles.waterButton, { borderColor: colors.water }]}
          >
            <Icon name="add" size={18} color={colors.ink} strokeWidth={1.5} />
            <Text style={[styles.waterButtonText, { color: colors.ink }]}>
              250 ml
            </Text>
          </Press>
        </View>
        <View style={styles.drops}>
          {Array.from({ length: Math.max(goals.water, water) }, (_, i) => (
            <Pressable
              key={i}
              hitSlop={4}
              style={styles.drop}
              accessibilityLabel={`Glass ${i + 1}`}
              onPress={() =>
                dispatch({
                  type: 'setWater',
                  date,
                  glasses: i + 1 === water ? i : i + 1,
                })
              }
            >
              <Icon
                name="waterDrop"
                size={24}
                color={colors.water}
                filled={i < water}
                strokeWidth={1.5}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.mealsHeader}>
        <Text style={[styles.mealsTitle, { color: colors.ink }]}>
          Today's meals
        </Text>
        <Text style={[styles.mealsCount, { color: colors.ink3 }]}>
          {loggedMeals.length} of 4 logged
        </Text>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <Seedling />
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>
            A clean page.
          </Text>
          <Text style={[styles.emptyText, { color: colors.ink2 }]}>
            Nothing logged yet {isToday ? 'today' : 'this day'}. One entry is
            enough to get the day growing.
          </Text>
          {yesterdayBreakfast.length > 0 && (
            <Press
              onPress={copyYesterdayBreakfast}
              style={[styles.outlineButton, { borderColor: colors.line }]}
            >
              <Icon
                name="tick"
                size={20}
                color={colors.ink}
                strokeWidth={1.5}
              />
              <Text style={[styles.outlineLabel, { color: colors.ink }]}>
                Copy yesterday's breakfast
              </Text>
            </Press>
          )}
        </View>
      ) : (
        <>
          <View
            style={[
              styles.mealCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.lineStrong,
              },
            ]}
          >
            {loggedMeals.map((meal, i) => (
              <MealRow
                key={meal.key}
                first={i === 0}
                label={meal.label}
                entries={entriesByMeal(entries, meal.key)}
                flash={highlight?.meal === meal.key ? highlight.id : null}
                onOpen={() =>
                  nav.push({ name: 'mealDetail', meal: meal.key, date })
                }
                onAdd={() => onLogFood(meal.key)}
                onDeleteMeal={() => {
                  const mealEntries = entriesByMeal(entries, meal.key);
                  const kcal = sumNutrition(mealEntries).calories;
                  Alert.alert(
                    `Delete ${meal.label.toLowerCase()}?`,
                    `${mealEntries.length} ${
                      mealEntries.length === 1 ? 'food' : 'foods'
                    } · ${fmt(kcal)} kcal will leave the log.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => onDeleteEntries(mealEntries, meal.label),
                      },
                    ],
                  );
                }}
              />
            ))}
          </View>
          {emptyMeals.map(meal => (
            <Press
              key={meal.key}
              onPress={() => onLogFood(meal.key)}
              accessibilityLabel={`Add food to ${meal.label}`}
              style={[styles.slot, { borderColor: colors.line }]}
            >
              <View style={[styles.slotIcon, { backgroundColor: colors.soft }]}>
                <Icon
                  name="add"
                  size={24}
                  color={colors.primary}
                  strokeWidth={1.5}
                />
              </View>
              <View>
                <Text style={[styles.mealName, { color: colors.ink }]}>
                  {meal.label}
                </Text>
                <Text style={[styles.mealFoods, { color: colors.ink2 }]}>
                  Nothing yet · {over ? 0 : fmt(left)} kcal still open
                </Text>
              </View>
            </Press>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const liters = (glasses: number) => `${glasses * 0.25} L`;

function WaterBadge({ pct }: { pct: number }) {
  const colors = useColors();
  const fill = Math.min(1, Math.max(0, pct));
  return (
    <FillShape
      width={36}
      height={40}
      viewBox="0 0 24 26"
      path="M12 2C7.6 7.6 4.5 11.8 4.5 16a7.5 7.5 0 0 0 15 0c0-4.2-3.1-8.4-7.5-14Z"
      top={2}
      bottom={23.5}
      pct={fill}
      fill={colors.water}
      stroke={colors.water}
      strokeWidth={1.5}
      motion="spring"
      wave={colors.waterSoft}
      accessibilityLabel={`${Math.round(fill * 100)} percent of the water goal`}
    >
      {fill > 0.15 && (
        <Path
          d="M8.2 16.5a3.6 3.6 0 0 0 2.6 3.3"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.7}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      )}
    </FillShape>
  );
}

// Own component, so each frame of the count re-renders only this text, not the whole screen.
function CountUp({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(value)).current;
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, anim]);
  return <>{fmt(shown)}</>;
}

function GrowBar({
  pct,
  color,
  track,
}: {
  pct: number;
  color: string;
  track: string;
}) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: pct,
      duration: 520,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [pct, value]);
  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            transformOrigin: 'left',
            transform: [{ scaleX: value }],
          },
        ]}
      />
    </View>
  );
}

function MealRow({
  first,
  label,
  entries,
  flash,
  onOpen,
  onAdd,
  onDeleteMeal,
}: {
  first: boolean;
  label: string;
  entries: Entry[];
  flash: number | null;
  onOpen: () => void;
  onAdd: () => void;
  onDeleteMeal: () => void;
}) {
  const colors = useColors();
  const kcal = sumNutrition(entries).calories;
  const time = entries
    .map(e => e.time)
    .filter(Boolean)
    .sort()
    .pop();
  const foods = entries.map(e => e.food.name).join(', ');
  const dark = useIsDark();
  // On a dark sky (afternoon, dusk, night) the text turns light.
  const light = !!time && skyIsDark(time);
  const ink = light ? fixed.cream : colors.ink;
  const ink2 = light ? 'rgba(246,241,231,0.85)' : colors.ink2;
  const ink3 = light ? 'rgba(246,241,231,0.7)' : colors.ink3;
  const skyInk = !!time && !light ? '#1F2A21' : null; // light skies stay light in dark mode too

  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (flash) {
      glow.setValue(1);
      Animated.timing(glow, {
        toValue: 0,
        duration: 600,
        delay: 1600,
        useNativeDriver: true,
      }).start();
    }
  }, [flash, glow]);

  return (
    <View
      style={[
        !first && { borderTopWidth: 1, borderTopColor: colors.line },
        { backgroundColor: colors.surface },
      ]}
    >
      {!!time && <MealSky time={time} dim={dark} />}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.soft, opacity: glow },
        ]}
      />
      <View style={styles.mealRow}>
        <Pressable
          onPress={onOpen}
          style={styles.mealBody}
          accessibilityRole="button"
          accessibilityLabel={`Open ${label}`}
        >
          <View style={styles.flex}>
            <View style={styles.mealNameRow}>
              <Text style={[styles.mealName, { color: skyInk ?? ink }]}>
                {label}
              </Text>
              {!!time && (
                <Text
                  style={[
                    styles.mealTime,
                    { color: skyInk ? '#3E4A40' : ink3 },
                  ]}
                >
                  {time}
                </Text>
              )}
              <Pressable
                onPress={onDeleteMeal}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${label}`}
                style={styles.mealBin}
              >
                <Icon
                  name="bin"
                  size={17}
                  color={skyInk ? '#3E4A40' : ink3}
                  strokeWidth={1.5}
                />
              </Pressable>
            </View>
            <Text
              style={[styles.mealFoods, { color: skyInk ? '#2E3A30' : ink2 }]}
              numberOfLines={2}
            >
              {foods}
            </Text>
          </View>
          <View style={styles.mealKcal}>
            <Text style={[styles.mealKcalValue, { color: skyInk ?? ink }]}>
              {fmt(kcal)}
            </Text>
            <Text
              style={[
                styles.mealKcalUnit,
                { color: skyInk ? '#3E4A40' : ink3 },
              ]}
            >
              kcal
            </Text>
          </View>
        </Pressable>
        <Press
          onPress={onAdd}
          scaleTo={0.94}
          accessibilityLabel={`Add food to ${label}`}
          style={[
            styles.mealAdd,
            { backgroundColor: flash ? colors.surface : colors.soft },
          ]}
        >
          <Icon name="add" size={20} color={colors.primary} strokeWidth={1.5} />
        </Press>
      </View>
    </View>
  );
}

function Seedling() {
  const colors = useColors();
  return (
    <Svg
      width={168}
      height={128}
      viewBox="0 0 168 128"
      accessibilityLabel="A small seedling sprouting from the ground"
    >
      <Path
        d="M24 118H144M52 124H116"
        stroke={colors.line}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M84 118V68"
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M84 84C60 84 46 70 44 50 66 50 82 62 84 84Z"
        fill={colors.soft}
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M84 72C84 50 100 38 126 36 126 58 110 72 84 72Z"
        fill={colors.leafFill}
        stroke={colors.primary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M84 52C73 40 73 24 84 8 95 24 95 40 84 52Z"
        fill="none"
        stroke={colors.ink3}
        strokeWidth={1.5}
        strokeDasharray="3 5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 56,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroDate: {
    color: 'rgba(246,241,231,0.72)',
  },
  greeting: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: fixed.cream,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingLeft: 10,
    paddingRight: 13,
    backgroundColor: 'rgba(246,241,231,0.14)',
    ...leaf(18, 4),
  },
  streakText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13.5,
    color: fixed.cream,
  },
  heroMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  // The leaves rise beside the greeting so the number sits close to it.
  heroLeaf: {
    marginTop: -6,
    marginRight: -12,
  },
  bigNumber: {
    fontFamily: fonts.display,
    fontSize: 88,
    lineHeight: 84,
    letterSpacing: -3.5,
  },
  bigLabel: {
    marginTop: 10,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: fixed.cream,
  },
  heroLine: {
    marginTop: 18,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: 'rgba(246,241,231,0.85)',
  },
  overNote: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: fixed.overLeaf,
    ...leaf(14, 4),
  },
  overNoteText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13.5,
    color: fixed.overNoteText,
  },
  macros: {
    flexDirection: 'row',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  macro: {
    flex: 1,
    paddingRight: 12,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  macroValueRow: {
    marginTop: 6,
  },
  macroValue: {
    fontFamily: fonts.display,
    fontSize: 28,
  },
  macroGoal: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  track: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  water: {
    marginTop: 22,
    marginHorizontal: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderWidth: 1.5,
    ...leaf(28, 6),
  },
  waterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  waterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  waterSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  waterAmount: {
    fontFamily: fonts.display,
    fontSize: 17,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  waterButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  drops: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 12,
  },
  drop: {
    flex: 1,
    alignItems: 'center',
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  mealsTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  mealsCount: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  mealCard: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 22,
    overflow: 'hidden',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 4,
  },
  mealNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
  mealTime: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  mealFoods: {
    marginTop: 3,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 18,
  },
  mealKcal: {
    alignItems: 'flex-end',
  },
  mealKcalValue: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 28,
  },
  mealKcalUnit: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  heroBack: {
    width: 44,
    height: 44,
    marginLeft: -12,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealBin: {
    marginLeft: 'auto',
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealAdd: {
    width: 44,
    height: 44,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(16, 5),
  },
  slot: {
    marginTop: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    ...leafFlipped(22, 6),
  },
  slotIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(16, 5),
  },
  empty: {
    marginTop: 8,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  emptyText: {
    maxWidth: 290,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  outlineButton: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  outlineLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
});
