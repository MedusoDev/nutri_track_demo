import { useRef } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from '../../components/Icon';
import {
  BottomBar,
  Display,
  MacroDot,
  Overline,
  Press,
  PrimaryButton,
  ScreenHeader,
  SplitBar,
} from '../../components/kit';
import { MEALS } from '../../data/foods';
import { useApp } from '../../state/AppContext';
import { useNav } from '../../state/nav';
import { fonts, leafFlipped, useColors } from '../../theme';
import { Entry, MealType } from '../../types';
import { addDays, fromDateKey } from '../../utils/date';
import {
  entriesByMeal,
  entriesOn,
  entryNutrition,
  macroSplit,
  sumNutrition,
} from '../../utils/nutrition';

const ACTIONS = 136; // width of the Edit + Remove buttons revealed by the swipe

export function dayName(date: string, today: string) {
  if (date === today) {
    return 'Today';
  }
  if (date === addDays(today, -1)) {
    return 'Yesterday';
  }
  return fromDateKey(date).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function MealDetailScreen({
  meal,
  date,
}: {
  meal: MealType;
  date: string;
}) {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const nav = useNav();
  const label = MEALS.find(m => m.key === meal)!.label;

  const entries = entriesByMeal(entriesOn(state.entries, date), meal);
  const totals = sumNutrition(entries);
  const split = macroSplit(totals);
  const time = entries
    .map(e => e.time)
    .filter(Boolean)
    .sort()[0];
  const pctOfDay = Math.round((totals.calories / state.goals.calories) * 100);

  const addFood = () => nav.push({ name: 'logFood', meal, date });

  function copyTo(target: string) {
    const stamp = Date.now();
    dispatch({
      type: 'addEntries',
      entries: entries.map((e, i) => ({
        ...e,
        id: `${stamp}-${i}`,
        date: target,
      })),
    });
    nav.toast(
      `${label} copied`,
      `${dayName(target, today)} · ${totals.calories} kcal`,
    );
  }

  function copyMeal() {
    Alert.alert(
      `Copy ${label.toLowerCase()}`,
      'Which day should get the same foods?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yesterday', onPress: () => copyTo(addDays(date, -1)) },
        {
          text: date === today ? 'Tomorrow' : 'Today',
          onPress: () => copyTo(date === today ? addDays(today, 1) : today),
        },
      ],
    );
  }

  function more() {
    Alert.alert(label, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Copy to another day', onPress: copyMeal },
      {
        text: 'Delete meal',
        style: 'destructive',
        onPress: () => {
          nav.deleted(entries, label);
          nav.pop();
        },
      },
    ]);
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        kind="back"
        onLeft={nav.pop}
        right={
          entries.length > 0 && (
            <Pressable
              onPress={more}
              style={styles.icon}
              accessibilityRole="button"
              accessibilityLabel="More options"
            >
              <Icon
                name="dots"
                size={24}
                color={colors.ink}
                strokeWidth={2.5}
              />
            </Pressable>
          )
        }
      />
      <ScrollView>
        <View style={styles.pad}>
          <Overline>
            {[
              dayName(date, today),
              time,
              `${entries.length} ${entries.length === 1 ? 'food' : 'foods'}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Overline>
          <Display size={40} style={styles.mt6}>
            {label}
          </Display>
        </View>

        <View style={[styles.pad, styles.mt22]}>
          <View style={styles.totals}>
            <Text style={[styles.total, { color: colors.ink }]}>
              {totals.calories}
            </Text>
            <Text style={[styles.totalUnit, { color: colors.ink }]}>kcal</Text>
            <Text style={[styles.ofDay, { color: colors.ink2 }]}>
              {pctOfDay}% of your day
            </Text>
          </View>
          <View style={styles.mt18}>
            <SplitBar
              protein={split.protein}
              carbs={split.carbs}
              fat={split.fat}
            />
          </View>
          <View style={styles.macros}>
            <MacroDot
              color={colors.protein}
              label="Protein"
              value={`${totals.protein} g`}
            />
            <MacroDot
              color={colors.carbs}
              label="Carbs"
              value={`${totals.carbs} g`}
            />
            <MacroDot
              color={colors.fat}
              label="Fat"
              value={`${totals.fat} g`}
            />
          </View>
        </View>

        <View style={[styles.pad, styles.listHead]}>
          <Text style={[styles.h2, { color: colors.ink }]}>
            What's on the plate
          </Text>
          {entries.length > 0 && (
            <Text style={[styles.hint, { color: colors.ink3 }]}>
              Swipe to edit
            </Text>
          )}
        </View>
        {entries.length > 0 ? (
          <View style={[styles.list, { borderColor: colors.lineStrong }]}>
            {entries.map((entry, i) => (
              <SwipeRow
                key={entry.id}
                entry={entry}
                first={i === 0}
                onEdit={() =>
                  nav.push({
                    name: 'foodDetail',
                    food: entry.food,
                    meal,
                    date,
                    mode: 'edit',
                    entry,
                  })
                }
                onRemove={() => nav.deleted([entry], entry.food.name)}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.empty, styles.pad, { color: colors.ink2 }]}>
            Nothing here anymore. Add a food, or go back to the day.
          </Text>
        )}

        <Press
          onPress={addFood}
          style={[styles.slot, { borderColor: colors.line }]}
        >
          <View style={[styles.slotIcon, { backgroundColor: colors.soft }]}>
            <Icon
              name="add"
              size={20}
              color={colors.primary}
              strokeWidth={1.5}
            />
          </View>
          <Text style={[styles.slotLabel, { color: colors.ink }]}>
            Add another food to {label}
          </Text>
        </Press>
        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomBar>
        {entries.length > 0 && (
          <Press
            onPress={copyMeal}
            accessibilityLabel="Copy meal to another day"
            style={[styles.copy, { borderColor: colors.line }]}
          >
            <Icon name="copy" size={24} color={colors.ink} strokeWidth={1.5} />
          </Press>
        )}
        <View style={styles.flex}>
          <PrimaryButton label="Add food" onPress={addFood} />
        </View>
      </BottomBar>
    </View>
  );
}

/** A food that slides left to reveal Edit and Remove. Tapping it opens Edit too. */
function SwipeRow({
  entry,
  first,
  onEdit,
  onRemove,
}: {
  entry: Entry;
  first: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  const x = useRef(new Animated.Value(0)).current;
  const open = useRef(false);
  const n = entryNutrition(entry);
  const grams = Math.round(entry.servings * entry.food.servingGrams);

  const snap = (to: boolean) => {
    open.current = to;
    Animated.spring(x, {
      toValue: to ? -ACTIONS : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const base = open.current ? -ACTIONS : 0;
        x.setValue(Math.max(-ACTIONS - 20, Math.min(0, base + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const base = open.current ? -ACTIONS : 0;
        snap(base + g.dx < -ACTIONS / 2);
      },
      onPanResponderTerminate: () => snap(open.current),
    }),
  ).current;

  return (
    <View
      style={[
        styles.item,
        !first && { borderTopWidth: 1, borderTopColor: colors.line },
      ]}
    >
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            snap(false);
            onEdit();
          }}
          style={[styles.action, { backgroundColor: colors.soft }]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${entry.food.name}`}
        >
          <Icon name="pencil" size={20} color={colors.ink} strokeWidth={1.5} />
          <Text style={[styles.actionLabel, { color: colors.ink }]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          style={[styles.action, { backgroundColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${entry.food.name}`}
        >
          <Icon
            name="bin"
            size={20}
            color={colors.onAccent}
            strokeWidth={1.5}
          />
          <Text style={[styles.actionLabel, { color: colors.onAccent }]}>
            Remove
          </Text>
        </Pressable>
      </View>
      <Animated.View
        {...pan.panHandlers}
        style={{ transform: [{ translateX: x }] }}
      >
        <Pressable
          onPress={() => (open.current ? snap(false) : onEdit())}
          style={[styles.itemBody, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityHint="Swipe left for edit and remove"
        >
          <View style={styles.flex}>
            <Text
              style={[styles.itemName, { color: colors.ink }]}
              numberOfLines={1}
            >
              {entry.food.name}
            </Text>
            <Text
              style={[styles.itemSub, { color: colors.ink2 }]}
              numberOfLines={1}
            >
              {entry.food.id === 'quick'
                ? 'Calories only'
                : `${grams} ${entry.food.unit === 'ml' ? 'ml' : 'g'}${
                    entry.food.brand ? ` · ${entry.food.brand}` : ''
                  }`}
            </Text>
            <Text style={[styles.itemMacros, { color: colors.ink3 }]}>
              P {n.protein} · C {n.carbs} · F {n.fat}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.itemKcal, { color: colors.ink }]}>
              {n.calories}
            </Text>
            <Text style={[styles.itemUnit, { color: colors.ink3 }]}>kcal</Text>
          </View>
          <Icon
            name="forward"
            size={18}
            color={colors.ink3}
            strokeWidth={1.5}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: {
    paddingHorizontal: 24,
  },
  mt6: {
    marginTop: 6,
  },
  mt18: {
    marginTop: 18,
  },
  mt22: {
    marginTop: 22,
  },
  totals: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  total: {
    fontFamily: fonts.display,
    fontSize: 84,
    lineHeight: 84,
    letterSpacing: -3.3,
  },
  totalUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
  },
  ofDay: {
    marginLeft: 'auto',
    fontFamily: fonts.sans,
    fontSize: 13.5,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 10,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  list: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 22,
    overflow: 'hidden',
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
  },
  item: {
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTIONS,
    flexDirection: 'row',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  itemBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15.5,
  },
  itemSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  itemMacros: {
    marginTop: 2,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
  },
  itemKcal: {
    fontFamily: fonts.display,
    fontSize: 24,
  },
  itemUnit: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  slot: {
    marginTop: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    ...leafFlipped(22, 6),
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  copy: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
