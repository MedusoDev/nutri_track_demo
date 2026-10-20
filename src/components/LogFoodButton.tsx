import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
  onPress: () => void;
}

export function LogFoodButton({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={styles.label}>LOG FOOD</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
