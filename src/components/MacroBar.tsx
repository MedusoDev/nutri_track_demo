import { StyleSheet, Text, View } from 'react-native';
import { Macro } from '../types';
import { colors, spacing } from '../theme';

interface Props {
  macro: Macro;
}

export function MacroBar({ macro }: Props) {
  const percent = Math.min((macro.consumed / macro.goal) * 100, 100);
  const barColor = colors[macro.key];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{macro.label}</Text>
        <Text style={styles.value}>
          {macro.consumed}g / {macro.goal}g
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  value: {
    fontSize: 13,
    color: colors.textMuted,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
