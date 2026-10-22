import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../components/Icon';
import { PillChip, Press, SearchField } from '../../components/kit';
import { useApp } from '../../state/AppContext';
import { useNav } from '../../state/nav';
import { fonts, leaf, leafFlipped, useColors } from '../../theme';
import { Food } from '../../types';
import { mealForNow } from '../../utils/nutrition';
import { foodSubtitle } from '../log/LogFoodScreen';

type Filter = 'all' | 'favorites' | 'custom' | 'brands';

// Same icons as the lists in Log food, so a section looks the same on both screens.
const SECTION_ICONS: Record<string, IconName> = {
  Favorites: 'heart',
  'My own recipes': 'pot',
  'Recipes to try': 'tabFoods',
  Library: 'book',
  Brands: 'tag',
};

export function FoodsScreen() {
  const { state, dispatch, today } = useApp();
  const colors = useColors();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    return state.foods.filter(
      f =>
        !text ||
        f.name.toLowerCase().includes(text) ||
        (f.brand ?? '').toLowerCase().includes(text),
    );
  }, [query, state.foods]);

  const isFav = (f: Food) => state.favorites.includes(f.id);
  const favorites = matches.filter(isFav);
  const custom = matches.filter(f => f.custom);
  const brands = matches.filter(f => !!f.brand);
  const recipes = matches.filter(f => f.recipe && !isFav(f));
  const rest = matches.filter(f => !isFav(f) && !f.custom && !f.recipe);

  const counts = {
    all: state.foods.length,
    favorites: state.favorites.length,
    custom: state.foods.filter(f => f.custom).length,
    brands: state.foods.filter(f => !!f.brand).length,
  };

  const open = (food: Food) =>
    nav.push({
      name: 'foodDetail',
      food,
      meal: mealForNow(),
      date: today,
      mode: 'log',
    });

  function remove(food: Food) {
    if (!food.custom) {
      return;
    }
    Alert.alert(
      `Delete ${food.name}?`,
      'It leaves your library. Days where you logged it stay as they are.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'removeFood', id: food.id });
            nav.toast(`${food.name} deleted`);
          },
        },
      ],
    );
  }

  const sections: { title: string; foods: Food[]; flipped?: boolean }[] =
    filter === 'favorites'
      ? [{ title: 'Favorites', foods: favorites }]
      : filter === 'custom'
      ? [{ title: 'My own recipes', foods: custom, flipped: true }]
      : filter === 'brands'
      ? [{ title: 'Brands', foods: brands }]
      : [
          { title: 'Favorites', foods: favorites },
          {
            title: 'My own recipes',
            foods: custom.filter(f => !isFav(f)),
            flipped: true,
          },
          { title: 'Recipes to try', foods: recipes, flipped: true },
          { title: 'Library', foods: rest },
        ];

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48, // the tab bar sits below the scroll; this is room for the raised "+"
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.pad, styles.head]}>
        <Text style={[styles.title, { color: colors.ink }]}>Foods</Text>
        <Press
          onPress={() => nav.push({ name: 'createFood' })}
          style={[styles.newFood, { borderColor: colors.primary }]}
        >
          <Icon name="add" size={20} color={colors.primary} strokeWidth={1.5} />
          <Text style={[styles.newFoodLabel, { color: colors.primary }]}>
            New food
          </Text>
        </Press>
      </View>
      <View style={[styles.pad, styles.mt16]}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search your library"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {(
          [
            ['all', 'All'],
            ['favorites', 'Favorites'],
            ['custom', 'Custom'],
            ['brands', 'Brands'],
          ] as const
        ).map(([key, label]) => (
          <PillChip
            key={key}
            label={`${label} · ${counts[key]}`}
            on={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </ScrollView>

      {sections
        .filter(s => s.foods.length > 0)
        .map(section => (
          <View key={section.title}>
            <View style={[styles.pad, styles.sectionHead]}>
              <View style={styles.titleRow}>
                <View
                  style={[styles.titleIcon, { backgroundColor: colors.soft }]}
                >
                  <Icon
                    name={SECTION_ICONS[section.title] ?? 'tabFoods'}
                    size={18}
                    color={colors.primary}
                    filled={section.title === 'Favorites'}
                    strokeWidth={1.5}
                  />
                </View>
                <Text style={[styles.h2, { color: colors.ink }]}>
                  {section.title}
                </Text>
              </View>
              <Text style={[styles.count, { color: colors.ink3 }]}>
                {section.foods.length}{' '}
                {section.foods.length === 1 ? 'food' : 'foods'}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.lineStrong,
                },
                section.flipped ? leafFlipped(26, 6) : styles.round,
              ]}
            >
              {section.foods.map((food, i) => (
                <FoodLine
                  key={food.id}
                  food={food}
                  first={i === 0}
                  favorite={isFav(food)}
                  onPress={() => open(food)}
                  onLongPress={() => remove(food)}
                  onHeart={() =>
                    dispatch({ type: 'toggleFavorite', id: food.id })
                  }
                />
              ))}
            </View>
          </View>
        ))}

      {sections.every(s => s.foods.length === 0) && (
        <View style={[styles.pad, styles.empty]}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>
            Nothing here yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.ink2 }]}>
            {query.trim()
              ? `No food matches “${query.trim()}”.`
              : filter === 'favorites'
              ? 'Tap the heart on a food to keep it here.'
              : 'Create your own foods and recipes with “New food”.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/** Tile colour follows the macro with the most calories in the food. */
function useTileColor(food: Food) {
  const colors = useColors();
  const p = food.protein * 4;
  const c = food.carbs * 4;
  const f = food.fat * 9;
  if (p >= c && p >= f) {
    return colors.proteinSoft;
  }
  return c >= f ? colors.carbsSoft : colors.fatSoft;
}

function FoodLine({
  food,
  first,
  favorite,
  onPress,
  onLongPress,
  onHeart,
}: {
  food: Food;
  first: boolean;
  favorite: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onHeart: () => void;
}) {
  const colors = useColors();
  const tile = useTileColor(food);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.line,
        !first && { borderTopWidth: 1, borderTopColor: colors.line },
      ]}
      accessibilityRole="button"
      accessibilityHint={food.custom ? 'Long press to delete' : undefined}
    >
      <View style={[styles.tile, { backgroundColor: tile }]}>
        <Text style={[styles.tileLetter, { color: colors.ink }]}>
          {food.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {food.name}
          </Text>
          {food.custom && (
            <View style={[styles.badge, { backgroundColor: colors.soft }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                Custom
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.sub, { color: colors.ink2 }]} numberOfLines={1}>
          {foodSubtitle(food)}
        </Text>
      </View>
      <Text style={[styles.kcal, { color: colors.ink }]}>
        {food.calories}
        <Text style={[styles.unit, { color: colors.ink3 }]}> kcal</Text>
      </Text>
      <Pressable
        onPress={onHeart}
        hitSlop={4}
        style={styles.heart}
        accessibilityRole="button"
        accessibilityLabel={
          favorite ? 'Remove from favorites' : 'Add to favorites'
        }
        accessibilityState={{ selected: favorite }}
      >
        <Icon
          name="heart"
          size={22}
          color={favorite ? colors.accent : colors.ink3}
          filled={favorite}
          strokeWidth={1.5}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: 20,
  },
  mt16: {
    marginTop: 16,
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
  newFood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingLeft: 12,
    paddingRight: 16,
    borderWidth: 1.5,
    ...leaf(22, 8),
  },
  newFoodLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(12, 4),
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 22,
    paddingBottom: 8,
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  count: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  card: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  round: {
    borderRadius: 22,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  tile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(16, 4),
  },
  tileLetter: {
    fontFamily: fonts.display,
    fontSize: 21,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15.5,
  },
  badge: {
    height: 20,
    paddingHorizontal: 8,
    justifyContent: 'center',
    ...leaf(10, 3),
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  kcal: {
    fontFamily: fonts.display,
    fontSize: 22,
  },
  unit: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  heart: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingTop: 28,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
  },
  emptyText: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 20,
  },
});
