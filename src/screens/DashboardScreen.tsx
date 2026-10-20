import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddMealCard } from '../components/AddMealCard';
import { CalorieRing } from '../components/CalorieRing';
import { Header } from '../components/Header';
import { LogFoodButton } from '../components/LogFoodButton';
import { MacroBar } from '../components/MacroBar';
import { MealCard } from '../components/MealCard';
import { TabBar } from '../components/TabBar';
import { DAILY_CALORIE_GOAL, MACROS, MEALS, TABS } from '../data/mock';
import { colors, spacing } from '../theme';
import { Meal, TabKey } from '../types';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [meals, setMeals] = useState<Meal[]>(MEALS);

  const consumed = meals.reduce((total, meal) => total + meal.calories, 0);

  function handleAddMeal() {
    const newMeal: Meal = {
      id: String(Date.now()),
      name: 'Snack',
      time: '16:00',
      description: 'Greek yogurt',
      calories: 150,
    };
    setMeals(current => [...current, newMeal]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header date={new Date()} />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'today' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <CalorieRing consumed={consumed} goal={DAILY_CALORIE_GOAL} />
          </View>

          <View style={styles.card}>
            {MACROS.map(macro => (
              <MacroBar key={macro.key} macro={macro} />
            ))}
          </View>

          <Text style={styles.sectionTitle}>MEALS</Text>
          {meals.map(meal => (
            <MealCard key={meal.id} meal={meal} />
          ))}
          <AddMealCard onPress={handleAddMeal} />
        </ScrollView>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>
      )}

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <LogFoodButton onPress={handleAddMeal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
