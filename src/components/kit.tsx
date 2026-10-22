// Building blocks of the new design (new-design/00-design-system), shared by onboarding and Today.
import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { fixed, fonts, leaf, overline, useColors } from '../theme';
import { Icon, IconName } from './Icon';

/** Press feedback from the design: 120 ms, scale .98. */
export function Press({
  style,
  children,
  scaleTo = 0.98,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.timing(scale, {
      toValue: value,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  return (
    <Pressable
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Overline({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const colors = useColors();
  return <Text style={[overline, { color: colors.ink3 }, style]}>{children}</Text>;
}

/** Big serif heading (Fraunces). */
export function Display({
  children,
  size = 34,
  style,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  const colors = useColors();
  return (
    <Text
      style={[
        { fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.08, letterSpacing: -size * 0.02, color: colors.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.ink2 }, style]}>{children}</Text>;
}

/** Main call to action: leaf-shaped, 56 tall. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  arrow,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  arrow?: boolean;
}) {
  const colors = useColors();
  const fg = disabled ? colors.ink3 : colors.onPrimary;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={[styles.primary, { backgroundColor: disabled ? colors.sunken : colors.primary }]}
    >
      <Text style={[styles.primaryLabel, { color: fg }]}>{label}</Text>
      {arrow && <Icon name="arrowRight" size={20} color={fg} strokeWidth={1.5} />}
    </Press>
  );
}

/** Text-only button, 44 tall. */
export function GhostButton({
  label,
  onPress,
  color,
  disabled,
}: {
  label: ReactNode;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.ghost} accessibilityRole="button" hitSlop={4}>
      <Text style={[styles.ghostLabel, { color: color ?? colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

/** Apple / Google style pill (mock: the real app would use the official SDK buttons). */
export function SsoButton({ provider, onPress }: { provider: 'apple' | 'google'; onPress: () => void }) {
  const colors = useColors();
  const apple = provider === 'apple';
  return (
    <Press
      onPress={onPress}
      style={[
        styles.sso,
        apple
          ? { backgroundColor: fixed.apple }
          : { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
      ]}
    >
      <Text style={[styles.ssoLabel, { color: apple ? fixed.cream : colors.ink }]}>
        Continue with {apple ? 'Apple' : 'Google'}
      </Text>
    </Press>
  );
}

export function OrDivider({ label = 'or with email' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
      <Text style={[styles.dividerText, { color: colors.ink3 }]}>{label}</Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
    </View>
  );
}

export function BackButton({ onPress, color }: { onPress: () => void; color?: string }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
      <Icon name="back" size={24} color={color ?? colors.ink3} strokeWidth={1.5} />
    </Pressable>
  );
}

/** Underlined text field with an overline label (email, password...). */
export function LineField({
  label,
  error,
  right,
  style,
  ...props
}: TextInputProps & { label: string; error?: boolean; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.field,
        { borderBottomColor: error ? colors.accent : colors.line, borderBottomWidth: error ? 2.5 : 1.5 },
        style,
      ]}
    >
      <Overline style={error ? { color: colors.accent } : undefined}>{label}</Overline>
      <View style={styles.row}>
        <TextInput
          placeholderTextColor={colors.ink3}
          style={[styles.input, { color: colors.ink }]}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <Text accessibilityRole="alert" style={[styles.error, { color: colors.accent }]}>
      {children}
    </Text>
  );
}

/** Segmented control (Male / Female, cm / ft, kg / lb). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  small?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.seg, { backgroundColor: colors.sunken, padding: small ? 2 : 3 }]}>
      {options.map(option => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[
              styles.segButton,
              small && styles.segButtonSmall,
              on && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.segLabel,
                small && styles.segLabelSmall,
                { color: on ? colors.onPrimary : colors.ink2 },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small leaf icon used as radio mark in the activity / pace lists. */
export function LeafMark({ on }: { on: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.leafMark}>
      <Icon name="leafMark" size={24} color={on ? colors.primary : colors.line} filled={on} strokeWidth={1.5} />
    </View>
  );
}

export function IconTile({ name, on }: { name: IconName; on: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.tile, { backgroundColor: on ? colors.primary : colors.sunken }]}>
      <Icon name={name} size={24} color={on ? colors.onPrimary : colors.ink2} strokeWidth={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  primary: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...leaf(28, 10),
  },
  primaryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
  ghost: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  sso: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    paddingVertical: 2,
    paddingHorizontal: 0,
    minHeight: 34,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    marginTop: 6,
  },
  seg: {
    flexDirection: 'row',
    borderRadius: 22,
    alignSelf: 'flex-start',
  },
  segButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segButtonSmall: {
    height: 28,
    paddingHorizontal: 10,
  },
  segLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  segLabelSmall: {
    fontSize: 12.5,
  },
  leafMark: {
    transform: [{ scaleX: -1 }],
  },
  tile: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(16, 4),
  },
});

/**
 * Screen enter animation: slides in from the side it came from (dir 1 = forward, -1 = back)
 * and fades in. Give it a `key` per screen so it replays on every change.
 */
export function Slide({
  dir = 1,
  style,
  children,
}: {
  dir?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 340,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value]);
  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        {
          opacity: value,
          transform: [{ translateX: value.interpolate({ inputRange: [0, 1], outputRange: [dir * 56, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
