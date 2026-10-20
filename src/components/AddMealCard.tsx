import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
  onPress: () => void;
}

export function AddMealCard({ onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.plus}>+</Text>
      <Text style={styles.label}>Add Meal</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  plus: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
