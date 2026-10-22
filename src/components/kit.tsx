// Building blocks of the new design (new-design/00-design-system), shared by onboarding and Today.
import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fixed, fonts, leaf, overline, useColors } from '../theme';
import { Icon, IconName } from './Icon';

/** Press feedback from the design: 120 ms, scale .98. */
export function Press({
  style,
  children,
  scaleTo = 0.98,
  ...props
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  scaleTo?: number;
}) {
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
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function Overline({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const colors = useColors();
  return (
    <Text style={[overline, { color: colors.ink3 }, style]}>{children}</Text>
  );
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
        {
          fontFamily: fonts.display,
          fontSize: size,
          lineHeight: size * 1.08,
          letterSpacing: -size * 0.02,
          color: colors.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const colors = useColors();
  return (
    <Text style={[styles.body, { color: colors.ink2 }, style]}>{children}</Text>
  );
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
      style={[
        styles.primary,
        { backgroundColor: disabled ? colors.sunken : colors.primary },
      ]}
    >
      <Text style={[styles.primaryLabel, { color: fg }]}>{label}</Text>
      {arrow && (
        <Icon name="arrowRight" size={20} color={fg} strokeWidth={1.5} />
      )}
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.ghost}
      accessibilityRole="button"
      hitSlop={4}
    >
      <Text style={[styles.ghostLabel, { color: color ?? colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Apple / Google style pill (mock: the real app would use the official SDK buttons). */
export function SsoButton({
  provider,
  onPress,
}: {
  provider: 'apple' | 'google';
  onPress: () => void;
}) {
  const colors = useColors();
  const apple = provider === 'apple';
  return (
    <Press
      onPress={onPress}
      style={[
        styles.sso,
        apple
          ? { backgroundColor: fixed.apple }
          : {
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.line,
            },
      ]}
    >
      <Text
        style={[styles.ssoLabel, { color: apple ? fixed.cream : colors.ink }]}
      >
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

export function BackButton({
  onPress,
  color,
}: {
  onPress: () => void;
  color?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={styles.back}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Icon
        name="back"
        size={24}
        color={color ?? colors.ink3}
        strokeWidth={1.5}
      />
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
}: TextInputProps & {
  label: string;
  error?: boolean;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.field,
        {
          borderBottomColor: error ? colors.accent : colors.line,
          borderBottomWidth: error ? 2.5 : 1.5,
        },
        style,
      ]}
    >
      <Overline style={error ? { color: colors.accent } : undefined}>
        {label}
      </Overline>
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
    <Text
      accessibilityRole="alert"
      style={[styles.error, { color: colors.accent }]}
    >
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
    <View
      style={[
        styles.seg,
        { backgroundColor: colors.sunken, padding: small ? 2 : 3 },
      ]}
    >
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
      <Icon
        name="leafMark"
        size={24}
        color={on ? colors.primary : colors.line}
        filled={on}
        strokeWidth={1.5}
      />
    </View>
  );
}

export function IconTile({ name, on }: { name: IconName; on: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: on ? colors.primary : colors.sunken },
      ]}
    >
      <Icon
        name={name}
        size={24}
        color={on ? colors.onPrimary : colors.ink2}
        strokeWidth={1.5}
      />
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
  screenHeader: {
    minHeight: 56,
    paddingLeft: 8,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  headerSide: {
    width: 44,
  },
  closeRound: {
    width: 40,
    height: 40,
    marginRight: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 28,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    paddingVertical: 0,
  },
  chip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  switchHit: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    padding: 2,
  },
  switchThumb: {
    width: 23,
    height: 23,
    ...leaf(12, 3),
  },
  split: {
    flexDirection: 'row',
    gap: 3,
    height: 12,
  },
  splitEmpty: {
    borderRadius: 6,
  },
  splitStart: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  splitEnd: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  dotValue: {
    fontFamily: fonts.display,
    fontSize: 19,
  },
  round: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingTop: 14,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 14,
    paddingHorizontal: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 18,
  },
});

/**
 * Screen enter animation: slides in from the side it came from (dir 1 = forward, -1 = back)
 * and fades in. Give it a `key` per screen so it replays on every change.
 */
export function Slide({
  dir = 1,
  from = 'side',
  leaving = false,
  onLeft,
  style,
  children,
}: {
  dir?: number;
  /** "bottom" rises like a sheet (modal screens: Log food, New food). */
  from?: 'side' | 'bottom';
  /** true = play the way out (sheet goes down, page slides away), then call onLeft. */
  leaving?: boolean;
  onLeft?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const value = useRef(new Animated.Value(0)).current;
  const rise = Dimensions.get('window').height * (leaving ? 1 : 0.6);
  const left = useRef(onLeft);
  left.current = onLeft;
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: from === 'bottom' ? 420 : 340,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, from]);
  useEffect(() => {
    if (!leaving) {
      return;
    }
    Animated.timing(value, {
      toValue: 0,
      duration: from === 'bottom' ? 300 : 260,
      easing: Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start(() => left.current?.());
  }, [leaving, value, from]);
  if (from === 'bottom') {
    return (
      <Animated.View
        style={[
          { flex: 1 },
          style,
          {
            opacity: value.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 1, 1],
            }),
            transform: [
              {
                translateY: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [rise, 0],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  }
  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        {
          opacity: value,
          transform: [
            {
              translateX: value.interpolate({
                inputRange: [0, 1],
                outputRange: [dir * 56, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Top bar of stacked / modal screens: X (modal) or back arrow (stacked), optional title and right slot. */
export function ScreenHeader({
  kind,
  onLeft,
  title,
  right,
}: {
  kind: 'close' | 'back';
  onLeft: () => void;
  title?: string;
  right?: ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // Modal screens close with a round X on the right; stacked screens go back on the left.
  if (kind === 'close') {
    return (
      <View style={[styles.screenHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerSide} />
        {!!title && (
          <Text style={[styles.screenTitle, { color: colors.ink }]}>
            {title}
          </Text>
        )}
        <Pressable
          onPress={onLeft}
          hitSlop={6}
          style={[
            styles.closeRound,
            { borderColor: colors.line, backgroundColor: colors.surface },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Icon name="x" size={20} color={colors.ink} strokeWidth={1.6} />
        </Pressable>
      </View>
    );
  }
  return (
    <View style={[styles.screenHeader, { paddingTop: insets.top }]}>
      <Pressable
        onPress={onLeft}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Icon name="back" size={24} color={colors.ink} strokeWidth={1.5} />
      </Pressable>
      {!!title && (
        <Text style={[styles.screenTitle, { color: colors.ink }]}>{title}</Text>
      )}
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/** Rounded search field (Log food, Foods). */
export function SearchField({
  strong,
  ...props
}: TextInputProps & { strong?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.search,
        {
          backgroundColor: colors.surface,
          borderColor: strong ? colors.primary : colors.line,
          borderWidth: strong ? 2 : 1.5,
          height: strong ? 56 : 52,
        },
      ]}
    >
      <Icon name="magnifier" size={24} color={colors.ink3} strokeWidth={1.5} />
      <TextInput
        placeholderTextColor={colors.ink3}
        autoCorrect={false}
        style={[styles.searchInput, { color: colors.ink }]}
        {...props}
      />
    </View>
  );
}

/** Pill chip with a border; filled when selected. */
export function PillChip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[
        styles.chip,
        on
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: colors.line },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: on ? colors.onPrimary : colors.ink2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** On/off switch with a leaf-shaped thumb that slides (220 ms). */
export function LeafSwitch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  const colors = useColors();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, x]);
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={styles.switchHit}
    >
      <View
        style={[
          styles.switchTrack,
          value
            ? { backgroundColor: colors.primary, borderColor: colors.primary }
            : { backgroundColor: colors.sunken, borderColor: colors.line },
        ]}
      >
        <Animated.View
          style={[
            styles.switchThumb,
            {
              backgroundColor: value ? colors.onPrimary : colors.ink3,
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 22],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

/** Three-colour bar with the calorie share (in percent) of protein, carbs and fat. */
export function SplitBar({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const colors = useColors();
  if (protein + carbs + fat <= 0) {
    return (
      <View
        style={[
          styles.split,
          styles.splitEmpty,
          { backgroundColor: colors.sunken },
        ]}
      />
    );
  }
  return (
    <View
      style={styles.split}
      accessibilityLabel={`Calorie share: protein ${Math.round(
        protein,
      )} percent, carbs ${Math.round(carbs)} percent, fat ${Math.round(
        fat,
      )} percent`}
    >
      <View
        style={[
          styles.splitStart,
          { flex: protein || 0.001, backgroundColor: colors.protein },
        ]}
      />
      <View style={{ flex: carbs || 0.001, backgroundColor: colors.carbs }} />
      <View
        style={[
          styles.splitEnd,
          { flex: fat || 0.001, backgroundColor: colors.fat },
        ]}
      />
    </View>
  );
}

/** Coloured dot + label, with an optional serif value ("• Protein 55 g"). */
export function MacroDot({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.dotLabel, { color: colors.ink2 }]}>
        {label}
        {value !== undefined && (
          <Text style={[styles.dotValue, { color: colors.ink }]}> {value}</Text>
        )}
      </Text>
    </View>
  );
}

/** Round outlined − / + button (portion steppers). */
export function RoundButton({
  icon,
  onPress,
  label,
  size = 52,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  const colors = useColors();
  return (
    <Press
      onPress={onPress}
      scaleTo={0.94}
      accessibilityLabel={label}
      style={[
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.primary,
        },
      ]}
    >
      <Icon name={icon} size={24} color={colors.primary} strokeWidth={1.5} />
    </Press>
  );
}

/** Bottom bar holding the main action of a screen. */
export function BottomBar({ children }: { children: ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** Small modal sheet for quick edits (weight, goals...). */
export function EditSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          <Display size={26}>{title}</Display>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
