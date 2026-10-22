import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import {
  BottomBar,
  Display,
  MacroDot,
  Overline,
  PillChip,
  PrimaryButton,
  RoundButton,
  ScreenHeader,
  Segmented,
  SplitBar,
} from '../../components/kit';
import { CATEGORIES, MEALS } from '../../data/foods';
import { useApp } from '../../state/AppContext';
import { useNav } from '../../state/nav';
import { fonts, useColors } from '../../theme';
import { Entry, Food, MealType } from '../../types';
import { macroSplit, nowRounded, scaled } from '../../utils/nutrition';

const one = (n: number) => String(Math.round(n * 10) / 10);

interface Props {
  food: Food;
  meal: MealType;
  date: string;
  mode: 'plate' | 'log' | 'edit';
  entry?: Entry;
}

export function FoodDetailScreen({ food, meal, date, mode, entry }: Props) {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const nav = useNav();
  const sg = food.servingGrams || 100;
  const unitLabel = food.unit === 'ml' ? 'ml' : 'g';

  const [grams, setGrams] = useState(Math.round((entry?.servings ?? 1) * sg));
  const [by, setBy] = useState<'g' | 's'>(food.unit === 'unit' ? 's' : 'g');

  const servings = grams / sg;
  const n = scaled(food, servings);
  const split = macroSplit(n);
  const favorite = state.favorites.includes(food.id);
  const mealLabel = MEALS.find(m => m.key === meal)!.label;
  const pctOfDay = Math.round((n.calories / state.goals.calories) * 100);

  const step = by === 'g' ? 10 : sg / 2;
  const change = (delta: number) =>
    setGrams(g => Math.max(step, Math.min(2000, Math.round(g + delta))));
  const presets =
    by === 'g'
      ? [...new Set([100, sg, Math.round(sg * 1.5), sg * 2])].sort(
          (a, b) => a - b,
        )
      : [0.5, 1, 1.5, 2].map(v => v * sg);

  const category = CATEGORIES.find(c => c.key === food.category)?.label ?? '';
  const d = food.details ?? {};
  const facts: { label: string; value: string; sub?: boolean }[] = [
    { label: 'Calories', value: `${Math.round(n.calories)} kcal` },
    { label: 'Total fat', value: `${one(n.fat)} g` },
    ...(d.saturated !== undefined
      ? [
          {
            label: 'Saturated',
            value: `${one(d.saturated * servings)} g`,
            sub: true,
          },
        ]
      : []),
    ...(d.cholesterol !== undefined
      ? [
          {
            label: 'Cholesterol',
            value: `${Math.round(d.cholesterol * servings)} mg`,
          },
        ]
      : []),
    ...(d.sodium !== undefined
      ? [{ label: 'Sodium', value: `${Math.round(d.sodium * servings)} mg` }]
      : []),
    { label: 'Carbohydrate', value: `${one(n.carbs)} g` },
    ...(d.fiber !== undefined
      ? [{ label: 'Fiber', value: `${one(d.fiber * servings)} g`, sub: true }]
      : []),
    ...(d.sugars !== undefined
      ? [{ label: 'Sugars', value: `${one(d.sugars * servings)} g`, sub: true }]
      : []),
    { label: 'Protein', value: `${one(n.protein)} g` },
  ];

  function confirm() {
    if (mode === 'edit' && entry) {
      dispatch({ type: 'updateEntry', id: entry.id, changes: { servings } });
      nav.toast(
        'Portion updated',
        `${food.name} · ${Math.round(n.calories)} kcal`,
      );
      nav.pop();
    } else if (mode === 'plate') {
      nav.addToPlate(food, servings);
      nav.pop();
    } else {
      nav.logged([
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date,
          meal,
          servings,
          food,
          time: nowRounded(),
        },
      ]);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScreenHeader
        kind="back"
        onLeft={nav.pop}
        right={
          food.id !== 'quick' && (
            <Pressable
              onPress={() => dispatch({ type: 'toggleFavorite', id: food.id })}
              accessibilityRole="button"
              accessibilityLabel="Favorite"
              accessibilityState={{ selected: favorite }}
              style={styles.heart}
            >
              <Icon
                name="heart"
                size={24}
                color={colors.accent}
                filled={favorite}
                strokeWidth={1.5}
              />
            </Pressable>
          )
        }
      />
      <ScrollView>
        <View style={styles.top}>
          <Overline>
            {[category, food.brand].filter(Boolean).join(' · ')}
          </Overline>
          <Display size={32} style={styles.mt6}>
            {food.name}
          </Display>
        </View>

        <View style={[styles.band, { backgroundColor: colors.soft }]}>
          <View style={styles.bandTop}>
            <View>
              <Text
                style={[styles.kcal, { color: colors.ink }]}
                accessibilityLiveRegion="polite"
              >
                {Math.round(n.calories)}
              </Text>
              <Text style={[styles.kcalUnit, { color: colors.ink }]}>kcal</Text>
            </View>
            <Text style={[styles.ofDay, { color: colors.ink2 }]}>
              <Text style={[styles.ofDayValue, { color: colors.ink }]}>
                {pctOfDay}%
              </Text>
              {'\n'}of today's goal
            </Text>
          </View>
          <View style={styles.mt22}>
            <SplitBar
              protein={split.protein}
              carbs={split.carbs}
              fat={split.fat}
            />
          </View>
          <View style={styles.macros}>
            {[
              { label: 'Protein', value: n.protein, color: colors.protein },
              { label: 'Carbs', value: n.carbs, color: colors.carbs },
              { label: 'Fat', value: n.fat, color: colors.fat },
            ].map(m => (
              <View key={m.label} style={styles.flex}>
                <MacroDot color={m.color} label={m.label} />
                <Text style={[styles.macroValue, { color: colors.ink }]}>
                  {one(m.value)}
                  <Text style={[styles.macroUnit, { color: colors.ink3 }]}>
                    {' '}
                    g
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {food.id !== 'quick' && (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.h2, { color: colors.ink }]}>Portion</Text>
              <Segmented
                options={[
                  {
                    value: 'g',
                    label: unitLabel === 'ml' ? 'Millilitres' : 'Grams',
                  },
                  { value: 's', label: 'Servings' },
                ]}
                value={by}
                onChange={setBy}
              />
            </View>
            <View style={[styles.rowBetween, styles.mt20]}>
              <RoundButton
                icon="minus"
                label="Decrease portion"
                onPress={() => change(-step)}
              />
              <View style={styles.center}>
                <Text>
                  <Text style={[styles.portion, { color: colors.ink }]}>
                    {by === 'g' ? Math.round(grams) : one(servings)}
                  </Text>
                  <Text style={[styles.portionUnit, { color: colors.ink2 }]}>
                    {' '}
                    {by === 'g'
                      ? unitLabel
                      : servings === 1
                      ? 'serving'
                      : 'servings'}
                  </Text>
                </Text>
                <Text style={[styles.hint, { color: colors.ink3 }]}>
                  {by === 'g'
                    ? `about ${one(servings)} × ${food.serving}`
                    : `1 serving = ${food.serving}`}
                </Text>
              </View>
              <RoundButton
                icon="add"
                label="Increase portion"
                onPress={() => change(step)}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presets}
            >
              {presets.map(g => (
                <PillChip
                  key={g}
                  on={Math.abs(g - grams) < 0.5}
                  onPress={() => setGrams(g)}
                  label={
                    by === 'g'
                      ? `${g} ${unitLabel}`
                      : `${one(g / sg)} ${
                          g / sg === 1 ? 'serving' : 'servings'
                        }`
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.section, styles.factsSection]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.h2, { color: colors.ink }]}>
              Nutrition facts
            </Text>
            {food.id !== 'quick' && (
              <Text style={[styles.hint, { color: colors.ink3 }]}>
                for {Math.round(grams)} {unitLabel}
              </Text>
            )}
          </View>
          <View style={styles.mt6}>
            {facts.map(f => (
              <View
                key={f.label}
                style={[
                  styles.fact,
                  { borderTopColor: colors.line },
                  f.sub && styles.factSub,
                ]}
              >
                <Text
                  style={[
                    styles.factLabel,
                    { color: f.sub ? colors.ink2 : colors.ink },
                  ]}
                >
                  {f.label}
                </Text>
                <Text style={[styles.factValue, { color: colors.ink }]}>
                  {f.value}
                </Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.line }} />
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomBar>
        <View style={styles.flex}>
          <PrimaryButton
            label={mode === 'edit' ? 'Save portion' : `Add to ${mealLabel}`}
            onPress={confirm}
          />
        </View>
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  heart: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 20,
  },
  mt6: {
    marginTop: 6,
  },
  mt20: {
    marginTop: 20,
  },
  mt22: {
    marginTop: 22,
  },
  band: {
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 26,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 56,
  },
  bandTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  kcal: {
    fontFamily: fonts.display,
    fontSize: 96,
    lineHeight: 90,
    letterSpacing: -3.8,
  },
  kcalUnit: {
    marginTop: 8,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
  },
  ofDay: {
    textAlign: 'right',
    fontFamily: fonts.sans,
    fontSize: 13.5,
    paddingBottom: 2,
  },
  ofDayValue: {
    fontFamily: fonts.display,
    fontSize: 22,
  },
  macros: {
    flexDirection: 'row',
    marginTop: 14,
  },
  macroValue: {
    fontFamily: fonts.display,
    fontSize: 26,
  },
  macroUnit: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  section: {
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  factsSection: {
    paddingTop: 32,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  center: {
    alignItems: 'center',
  },
  portion: {
    fontFamily: fonts.display,
    fontSize: 56,
  },
  portionUnit: {
    fontFamily: fonts.sans,
    fontSize: 17,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  presets: {
    gap: 8,
    marginTop: 20,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 11,
    borderTopWidth: 1,
  },
  factSub: {
    paddingLeft: 16,
  },
  factLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  factValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
});
