import { StyleSheet, Text, View } from 'react-native';
import { Meal } from '../types';
import { colors, spacing } from '../theme';

interface Props {
  meal: Meal;
}

export function MealCard({ meal }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{meal.name}</Text>
        <Text style={styles.description}>
          {meal.time} · {meal.description}
        </Text>
      </View>
      <Text style={styles.calories}>{meal.calories} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  calories: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
