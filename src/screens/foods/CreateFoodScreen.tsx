import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../components/Icon';
import {
  BottomBar,
  ErrorText,
  LeafSwitch,
  Overline,
  PrimaryButton,
  ScreenHeader,
  PillChip,
  Segmented,
} from '../../components/kit';
import { useApp } from '../../state/AppContext';
import { useNav } from '../../state/nav';
import { fonts, leaf, useColors } from '../../theme';
import { ServingUnit } from '../../types';
import { FoodForm, macroCheck, validateFood } from '../../utils/foodForm';

const NO_BRAND = 'No brand';
const OTHER = '__other__';

export function CreateFoodScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const nav = useNav();
  const [form, setForm] = useState<FoodForm>({
    name: '',
    servingSize: '100',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  // Brand is picked from the brands already in the library (or "+ Other" to type a new one).
  const brandOptions = [
    NO_BRAND,
    'Homemade',
    ...[
      ...new Set(
        state.foods
          .map(f => f.brand)
          .filter((b): b is string => !!b && b !== 'Homemade'),
      ),
    ].sort(),
  ];
  const [brand, setBrand] = useState(NO_BRAND);
  const [otherBrand, setOtherBrand] = useState('');
  const [unit, setUnit] = useState<ServingUnit>('g');
  const [favorite, setFavorite] = useState(true);
  const [tried, setTried] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  const set = (key: keyof FoodForm) => (text: string) =>
    setForm(f => ({ ...f, [key]: text }));
  const errors = tried ? validateFood(form) : {};
  const check = macroCheck(form);
  const n = (text: string) => Number(text.replace(',', '.') || 0);

  function save() {
    setTried(true);
    if (Object.keys(validateFood(form)).length) {
      return;
    }
    const size = n(form.servingSize);
    const name = form.name.trim();
    const id = `custom-${Date.now()}`;
    dispatch({
      type: 'addFood',
      food: {
        id,
        name,
        emoji: '🍽️',
        serving: unit === 'unit' ? '1 unit' : `${size} ${unit}`,
        servingGrams: unit === 'unit' ? 100 : size,
        unit,
        brand:
          (brand === OTHER
            ? otherBrand.trim()
            : brand === NO_BRAND
            ? ''
            : brand) || undefined,
        category: 'snacks',
        calories: Math.round(n(form.calories) || check.fromMacros),
        protein: n(form.protein),
        carbs: n(form.carbs),
        fat: n(form.fat),
        custom: true,
      },
    });
    if (favorite) {
      dispatch({ type: 'toggleFavorite', id });
    }
    nav.toast(`${name} saved`, 'In Foods · My own recipes');
    nav.pop();
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScreenHeader kind="close" title="New food" onLeft={nav.pop} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <Field label="Name" on={focus === 'name'} bad={!!errors.name}>
          <TextInput
            value={form.name}
            onChangeText={set('name')}
            onFocus={() => setFocus('name')}
            onBlur={() => setFocus(null)}
            placeholder="Tapioca with cheese"
            placeholderTextColor={colors.ink3}
            style={[styles.nameInput, { color: colors.ink }]}
          />
        </Field>
        {!!errors.name && <ErrorText>{errors.name}</ErrorText>}

        <Overline style={styles.mt20}>
          Brand <Text style={styles.note}>· optional</Text>
        </Overline>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brands}
          keyboardShouldPersistTaps="handled"
        >
          {brandOptions.map(option => (
            <PillChip
              key={option}
              label={option}
              on={brand === option}
              onPress={() => setBrand(option)}
            />
          ))}
          <PillChip
            label="+ Other"
            on={brand === OTHER}
            onPress={() => setBrand(OTHER)}
          />
        </ScrollView>
        {brand === OTHER && (
          <Field label="Brand name" on={focus === 'brand'} style={styles.mt8}>
            <TextInput
              value={otherBrand}
              onChangeText={setOtherBrand}
              onFocus={() => setFocus('brand')}
              onBlur={() => setFocus(null)}
              autoFocus
              placeholder="Type the brand"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { color: colors.ink }]}
            />
          </Field>
        )}

        <View style={styles.servingRow}>
          <Field
            label="One serving is"
            on={focus === 'size'}
            bad={!!errors.servingSize}
            style={styles.flex}
          >
            <TextInput
              value={unit === 'unit' ? '1' : form.servingSize}
              editable={unit !== 'unit'}
              onChangeText={set('servingSize')}
              onFocus={() => setFocus('size')}
              onBlur={() => setFocus(null)}
              keyboardType="decimal-pad"
              style={[styles.serifInput, { color: colors.ink }]}
            />
          </Field>
          <View style={styles.mb4}>
            <Segmented
              options={[
                { value: 'g', label: 'g' },
                { value: 'ml', label: 'ml' },
                { value: 'unit', label: 'unit' },
              ]}
              value={unit}
              onChange={setUnit}
            />
          </View>
        </View>
        {!!errors.servingSize && <ErrorText>{errors.servingSize}</ErrorText>}

        <Overline style={styles.mt26}>Calories per serving</Overline>
        <View style={styles.kcalRow}>
          <TextInput
            value={form.calories}
            onChangeText={set('calories')}
            keyboardType="number-pad"
            placeholder={check.fromMacros ? String(check.fromMacros) : '0'}
            placeholderTextColor={colors.ink3}
            accessibilityLabel="Calories"
            style={[styles.kcalInput, { color: colors.ink }]}
          />
          <Text style={[styles.kcalUnit, { color: colors.ink }]}>kcal</Text>
        </View>
        {!!errors.calories && <ErrorText>{errors.calories}</ErrorText>}

        <View style={styles.macros}>
          {(
            [
              ['protein', 'Protein', colors.protein],
              ['carbs', 'Carbs', colors.carbs],
              ['fat', 'Fat', colors.fat],
            ] as const
          ).map(([key, label, color]) => (
            <View
              key={key}
              style={[
                styles.macroBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors[key] ? colors.accent : colors.line,
                },
              ]}
            >
              <View style={[styles.macroStripe, { backgroundColor: color }]} />
              <Overline style={styles.mt2}>{label}</Overline>
              <View style={styles.macroValue}>
                <TextInput
                  value={form[key]}
                  onChangeText={set(key)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.ink3}
                  accessibilityLabel={`${label} in grams`}
                  style={[styles.macroInput, { color: colors.ink }]}
                />
                <Text style={[styles.gram, { color: colors.ink3 }]}>g</Text>
              </View>
            </View>
          ))}
        </View>

        {(n(form.protein) || n(form.carbs) || n(form.fat) || n(form.calories)) >
          0 && (
          <View
            style={[
              styles.check,
              {
                backgroundColor: check.matches
                  ? colors.soft
                  : colors.accentSoft,
              },
            ]}
          >
            <Icon
              name={check.matches ? 'tick' : 'dash'}
              size={20}
              color={check.matches ? colors.primary : colors.accent}
              strokeWidth={1.5}
            />
            <Text style={[styles.checkText, { color: colors.ink }]}>
              Macros add up to{' '}
              <Text style={styles.bold}>{check.fromMacros} kcal</Text>.{' '}
              {check.matches
                ? n(form.calories)
                  ? 'Matches what you entered.'
                  : 'We will use this as the calories.'
                : `That is more than 10% away from ${Math.round(
                    n(form.calories),
                  )} kcal. Check the label.`}
            </Text>
          </View>
        )}

        <View style={[styles.favRow, { borderColor: colors.line }]}>
          <View style={styles.favLabel}>
            <Icon
              name="heart"
              size={24}
              color={colors.accent}
              strokeWidth={1.5}
            />
            <Text style={[styles.favText, { color: colors.ink }]}>
              Add to favorites
            </Text>
          </View>
          <LeafSwitch
            value={favorite}
            onChange={setFavorite}
            label="Add to favorites"
          />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
      <BottomBar>
        <View style={styles.flex}>
          <PrimaryButton label="Save food" onPress={save} />
        </View>
      </BottomBar>
    </View>
  );
}

function Field({
  label,
  note,
  on,
  bad,
  style,
  children,
}: {
  label: string;
  note?: string;
  on?: boolean;
  bad?: boolean;
  style?: object;
  children: ReactNode;
}) {
  const colors = useColors();
  const color = bad ? colors.accent : on ? colors.primary : colors.line;
  return (
    <View
      style={[
        styles.field,
        { borderBottomColor: color, borderBottomWidth: on || bad ? 2.5 : 1.5 },
        style,
      ]}
    >
      <Overline style={on ? { color: colors.primary } : undefined}>
        {label}
        {!!note && <Text style={styles.note}> {note}</Text>}
      </Overline>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingTop: 6,
    paddingHorizontal: 24,
  },
  mt2: {
    marginTop: 2,
  },
  mt8: {
    marginTop: 8,
  },
  mt20: {
    marginTop: 20,
  },
  brands: {
    gap: 8,
    paddingTop: 8,
  },
  mt14: {
    marginTop: 14,
  },
  mt26: {
    marginTop: 26,
  },
  mb4: {
    marginBottom: 4,
  },
  field: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  note: {
    textTransform: 'none',
    letterSpacing: 0,
    fontFamily: fonts.sans,
  },
  nameInput: {
    fontFamily: fonts.display,
    fontSize: 28,
    padding: 0,
    minHeight: 40,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 17,
    padding: 0,
    minHeight: 32,
  },
  serifInput: {
    fontFamily: fonts.display,
    fontSize: 28,
    padding: 0,
    minHeight: 40,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    marginTop: 20,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  kcalInput: {
    minWidth: 120,
    fontFamily: fonts.display,
    fontSize: 72,
    letterSpacing: -2.8,
    padding: 0,
  },
  kcalUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
  },
  macros: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  macroBox: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderWidth: 1.5,
    borderRadius: 18,
    overflow: 'hidden',
  },
  macroStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  macroValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  macroInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 30,
    padding: 0,
    minHeight: 40,
  },
  gram: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  check: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...leaf(16, 4),
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
  },
  bold: {
    fontFamily: fonts.sansSemiBold,
  },
  favRow: {
    marginTop: 18,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  favLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
});
