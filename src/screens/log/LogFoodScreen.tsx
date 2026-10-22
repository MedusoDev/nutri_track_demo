// Nothing is logged until "Log N foods", so several foods can be added in one go.
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../components/Icon';
import {
  Overline,
  Slide,
  Press,
  PrimaryButton,
  ScreenHeader,
  SearchField,
} from '../../components/kit';
import { MEALS } from '../../data/foods';
import { useApp } from '../../state/AppContext';
import { useNav } from '../../state/nav';
import { fonts, leaf, useColors } from '../../theme';
import { Entry, Food, MealType } from '../../types';
import {
  nowRounded,
  quickAddFood,
  recentFoods,
  shiftTime,
} from '../../utils/nutrition';

type Source = 'recent' | 'favorites' | 'library' | 'own';

const SOURCES: { key: Source; label: string; icon: IconName }[] = [
  { key: 'recent', label: 'Recent', icon: 'clock' },
  { key: 'favorites', label: 'Favorites', icon: 'heart' },
  { key: 'library', label: 'Library', icon: 'book' },
  { key: 'own', label: 'My recipes', icon: 'pot' },
];

const EMPTY: Record<Source, { title: string; text: string }> = {
  recent: {
    title: 'Nothing logged yet',
    text: 'Foods you log show up here, so the next time is one tap.',
  },
  favorites: {
    title: 'No favorites yet',
    text: 'Tap the heart on a food to keep it here.',
  },
  library: {
    title: 'The library is empty',
    text: 'Search by name, or create your own food.',
  },
  own: {
    title: 'No recipes of your own yet',
    text: 'Save the dishes you make at home and log them in one tap.',
  },
};

const MEAL_ICONS: Record<MealType, IconName> = {
  breakfast: 'mealBreakfast',
  lunch: 'mealLunch',
  snack: 'mealSnack',
  dinner: 'moon',
};

export const foodSubtitle = (food: Food) =>
  food.brand ? `${food.brand} · ${food.serving}` : food.serving;

interface Props {
  meal: MealType;
  date: string;
}

export function LogFoodScreen({ meal: initialMeal, date }: Props) {
  const { state } = useApp();
  const colors = useColors();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [time, setTime] = useState(nowRounded());
  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState('350');

  const favorites = state.favorites
    .map(id => state.foods.find(f => f.id === id))
    .filter((f): f is Food => !!f);
  const recent = recentFoods(state.entries, 12);
  const library = state.foods.filter(f => !f.custom);
  const own = state.foods.filter(f => f.custom);
  // Opens on Recent when there is history; a brand-new user starts on the Library.
  const [source, setSource] = useState<Source>(
    recent.length ? 'recent' : 'library',
  );
  const sourceDir = useRef(1);
  const pickSource = (next: Source) => {
    const order = SOURCES.map(x => x.key);
    sourceDir.current = order.indexOf(next) >= order.indexOf(source) ? 1 : -1;
    setSource(next);
  };
  const asItems = (foods: Food[]) => foods.map(food => ({ food, servings: 1 }));
  const lists: Record<Source, { food: Food; servings: number }[]> = {
    recent,
    favorites: asItems(favorites),
    library: asItems(library),
    own: asItems(own),
  };

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) {
      return [];
    }
    return state.foods.filter(
      f =>
        f.name.toLowerCase().includes(text) ||
        (f.brand ?? '').toLowerCase().includes(text),
    );
  }, [query, state.foods]);

  const plateKcal = nav.plate.reduce(
    (sum, p) => sum + Math.round(p.food.calories * p.servings),
    0,
  );
  const mealLabel = MEALS.find(m => m.key === meal)!.label;

  const openFood = (food: Food) =>
    nav.push({ name: 'foodDetail', food, meal, date, mode: 'plate' });

  function addQuick() {
    const kcal = Math.round(Number(quick));
    if (!kcal || kcal < 1 || kcal > 5000) {
      Alert.alert('Quick add', 'Type the calories, from 1 to 5000.');
      return;
    }
    nav.addToPlate(quickAddFood(kcal), 1);
  }

  function logAll() {
    const entries: Entry[] = nav.plate.map((p, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      meal,
      servings: p.servings,
      food: p.food,
      time,
    }));
    nav.logged(entries);
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScreenHeader kind="close" title="Log food" onLeft={nav.pop} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.pad}>
          <Overline style={styles.mb8}>Adding to</Overline>
        </View>
        <View style={[styles.meals, styles.pad]}>
          {MEALS.map(m => {
            const on = m.key === meal;
            return (
              <View key={m.key} style={styles.mealCell}>
                <Press
                  onPress={() => setMeal(m.key)}
                  scaleTo={0.95}
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={m.label}
                  style={[
                    styles.mealTile,
                    on
                      ? {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        }
                      : {
                          backgroundColor: colors.surface,
                          borderColor: colors.lineStrong,
                        },
                  ]}
                >
                  <Icon
                    name={MEAL_ICONS[m.key]}
                    size={26}
                    color={on ? colors.onPrimary : colors.primary}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={[
                      styles.mealLabel,
                      { color: on ? colors.onPrimary : colors.ink2 },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Press>
              </View>
            );
          })}
        </View>

        <View style={[styles.timeRow, styles.pad]}>
          <Text style={[styles.timeLabel, { color: colors.ink2 }]}>
            Eaten at
          </Text>
          <View style={styles.timeControl}>
            <Pressable
              onPress={() => setTime(t => shiftTime(t, -15))}
              hitSlop={6}
              accessibilityLabel="15 minutes earlier"
              style={[styles.timeButton, { backgroundColor: colors.sunken }]}
            >
              <Icon name="minus" size={16} color={colors.ink} />
            </Pressable>
            <Text style={[styles.time, { color: colors.ink }]}>{time}</Text>
            <Pressable
              onPress={() => setTime(t => shiftTime(t, 15))}
              hitSlop={6}
              accessibilityLabel="15 minutes later"
              style={[styles.timeButton, { backgroundColor: colors.sunken }]}
            >
              <Icon name="plus" size={16} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchRow, styles.pad]}>
          <View style={styles.flex}>
            <SearchField
              strong
              value={query}
              onChangeText={setQuery}
              placeholder="Search foods or brands"
            />
          </View>
          <Press
            onPress={() =>
              Alert.alert(
                'Barcode scanner',
                'The camera screen is not designed yet. Search by name for now.',
              )
            }
            accessibilityLabel="Scan barcode"
            style={[styles.scan, { backgroundColor: colors.primary }]}
          >
            <Icon
              name="barcode"
              size={24}
              color={colors.onPrimary}
              strokeWidth={1.5}
            />
          </Press>
        </View>

        {query.trim() ? (
          <View style={styles.section}>
            {results.length ? (
              <FoodList
                items={results.map(food => ({ food, servings: 1 }))}
                onOpen={openFood}
              />
            ) : (
              <View style={[styles.noResults, styles.pad]}>
                <Text style={[styles.noTitle, { color: colors.ink }]}>
                  No foods found
                </Text>
                <Text style={[styles.noText, { color: colors.ink2 }]}>
                  Nothing matches “{query.trim()}”. Try another name, or create
                  it.
                </Text>
                <Press
                  onPress={() => nav.push({ name: 'createFood' })}
                  style={[styles.outline, { borderColor: colors.primary }]}
                >
                  <Icon
                    name="add"
                    size={18}
                    color={colors.primary}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={[styles.outlineLabel, { color: colors.primary }]}
                  >
                    Create a food
                  </Text>
                </Press>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={[styles.quick, { backgroundColor: colors.soft }]}>
              <View style={styles.flex}>
                <Text style={[styles.quickTitle, { color: colors.ink }]}>
                  Quick add
                </Text>
                <Text style={[styles.quickSub, { color: colors.ink2 }]}>
                  Only know the calories?
                </Text>
              </View>
              <View
                style={[
                  styles.quickField,
                  { backgroundColor: colors.bg, borderColor: colors.line },
                ]}
              >
                <TextInput
                  value={quick}
                  onChangeText={setQuick}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  accessibilityLabel="Calories"
                  style={[styles.quickInput, { color: colors.ink }]}
                />
                <Text style={[styles.quickUnit, { color: colors.ink3 }]}>
                  kcal
                </Text>
              </View>
              <Press
                onPress={addQuick}
                style={[styles.quickAdd, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.quickAddLabel, { color: colors.onPrimary }]}
                >
                  Add
                </Text>
              </Press>
            </View>

            <View style={[styles.sources, styles.pad]}>
              {SOURCES.map(src => {
                const on = source === src.key;
                return (
                  <View key={src.key} style={styles.mealCell}>
                    <Press
                      onPress={() => pickSource(src.key)}
                      scaleTo={0.95}
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={src.label}
                      style={[
                        styles.sourceTile,
                        on
                          ? {
                              backgroundColor: colors.soft,
                              borderColor: colors.primary,
                            }
                          : {
                              backgroundColor: colors.surface,
                              borderColor: colors.lineStrong,
                            },
                      ]}
                    >
                      <Icon
                        name={src.icon}
                        size={22}
                        color={on ? colors.primary : colors.ink2}
                        filled={on && src.key === 'favorites'}
                        strokeWidth={1.5}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.sourceLabel,
                          { color: on ? colors.ink : colors.ink2 },
                        ]}
                      >
                        {src.label}
                      </Text>
                    </Press>
                  </View>
                );
              })}
            </View>
            <Slide key={source} dir={sourceDir.current} style={styles.noFlex}>
              {lists[source].length > 0 ? (
                <FoodList items={lists[source]} onOpen={openFood} />
              ) : (
                <View style={[styles.noResults, styles.pad]}>
                  <Text style={[styles.noTitle, { color: colors.ink }]}>
                    {EMPTY[source].title}
                  </Text>
                  <Text style={[styles.noText, { color: colors.ink2 }]}>
                    {EMPTY[source].text}
                  </Text>
                  {source === 'own' && (
                    <Press
                      onPress={() => nav.push({ name: 'createFood' })}
                      style={[styles.outline, { borderColor: colors.primary }]}
                    >
                      <Icon
                        name="add"
                        size={18}
                        color={colors.primary}
                        strokeWidth={1.5}
                      />
                      <Text
                        style={[styles.outlineLabel, { color: colors.primary }]}
                      >
                        Create a food
                      </Text>
                    </Press>
                  )}
                </View>
              )}
            </Slide>
          </>
        )}
        <View style={{ height: nav.plate.length ? 220 : 40 }} />
      </ScrollView>

      {nav.plate.length > 0 && (
        <View
          style={[
            styles.tray,
            {
              backgroundColor: colors.bg,
              borderTopColor: colors.line,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <Overline>
            Your {mealLabel.toLowerCase()} · {time} · not logged yet
          </Overline>
          <ScrollView style={styles.trayList}>
            {nav.plate.map(p => (
              <View key={p.key} style={styles.trayItem}>
                <View style={styles.flex}>
                  <Text
                    style={[styles.trayName, { color: colors.ink }]}
                    numberOfLines={1}
                  >
                    {p.food.name}
                  </Text>
                  <Text style={[styles.trayDetail, { color: colors.ink3 }]}>
                    {p.food.id === 'quick'
                      ? 'Calories only'
                      : `${Math.round(p.servings * p.food.servingGrams)} ${
                          p.food.unit === 'ml' ? 'ml' : 'g'
                        }`}
                  </Text>
                </View>
                <Text style={[styles.trayKcal, { color: colors.ink2 }]}>
                  {Math.round(p.food.calories * p.servings)} kcal
                </Text>
                <Pressable
                  onPress={() => nav.removeFromPlate(p.key)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${p.food.name}`}
                  style={styles.trayRemove}
                >
                  <Icon
                    name="x"
                    size={16}
                    color={colors.ink3}
                    strokeWidth={1.5}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <PrimaryButton
            label={`Log ${nav.plate.length} ${
              nav.plate.length === 1 ? 'food' : 'foods'
            } · ${plateKcal} kcal`}
            onPress={logAll}
          />
        </View>
      )}
    </View>
  );
}

export function FoodList({
  items,
  onOpen,
}: {
  items: { food: Food; servings: number }[];
  onOpen: (food: Food) => void;
}) {
  const colors = useColors();
  const nav = useNav();
  const inPlate = new Set(nav.plate.map(p => p.food.id));
  return (
    <View
      style={[
        styles.list,
        { backgroundColor: colors.surface, borderColor: colors.lineStrong },
      ]}
    >
      {items.map(({ food, servings }, i) => (
        <Pressable
          key={food.id}
          onPress={() => onOpen(food)}
          style={[
            styles.row,
            i > 0 && { borderTopWidth: 1, borderTopColor: colors.line },
            inPlate.has(food.id) && { backgroundColor: colors.soft },
          ]}
          accessibilityRole="button"
        >
          <View style={styles.flex}>
            <Text
              style={[styles.rowName, { color: colors.ink }]}
              numberOfLines={1}
            >
              {food.name}
            </Text>
            <Text
              style={[styles.rowSub, { color: colors.ink2 }]}
              numberOfLines={1}
            >
              {foodSubtitle(food)}
            </Text>
          </View>
          <Text style={[styles.rowKcal, { color: colors.ink }]}>
            {Math.round(food.calories * servings)}
            <Text style={[styles.rowUnit, { color: colors.ink3 }]}> kcal</Text>
          </Text>
          <Press
            onPress={() => nav.addToPlate(food, servings)}
            scaleTo={0.94}
            accessibilityLabel={`Add ${food.name}`}
            style={[styles.add, { borderColor: colors.primary }]}
          >
            <Icon
              name="add"
              size={20}
              color={colors.primary}
              strokeWidth={1.5}
            />
          </Press>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingTop: 12,
  },
  pad: {
    paddingHorizontal: 20,
  },
  mb8: {
    marginBottom: 8,
  },
  meals: {
    flexDirection: 'row',
    gap: 8,
  },
  mealCell: {
    flex: 1,
  },
  mealTile: {
    height: 76,
    ...leaf(20, 6),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mealLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  timeLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14.5,
  },
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    minWidth: 64,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 22,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  scan: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(28, 10),
  },
  section: {
    marginTop: 16,
  },
  noResults: {
    paddingTop: 8,
  },
  noTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
  },
  noText: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 20,
  },
  outline: {
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
  outlineLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  quick: {
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...leaf(22, 6),
  },
  quickTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  quickSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  quickField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  quickInput: {
    width: 56,
    padding: 0,
    textAlign: 'right',
    fontFamily: fonts.display,
    fontSize: 24,
  },
  quickUnit: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  quickAdd: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  sources: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 26,
    paddingBottom: 12,
  },
  sourceTile: {
    height: 64,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...leaf(18, 5),
  },
  sourceLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  noFlex: {
    flex: 0,
  },
  list: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 22,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
  },
  rowName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15.5,
  },
  rowSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  rowKcal: {
    fontFamily: fonts.display,
    fontSize: 22,
  },
  rowUnit: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  add: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(22, 6),
  },
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    gap: 8,
  },
  trayList: {
    maxHeight: 120,
  },
  trayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  trayName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  trayDetail: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  trayKcal: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  trayRemove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
