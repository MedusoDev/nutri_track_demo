import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, leaf, useColors } from '../theme';
import { TabKey } from '../types';
import { Icon, IconName } from './Icon';
import { Press } from './kit';

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'today', label: 'Today', icon: 'tabToday' },
  { key: 'history', label: 'History', icon: 'tabHistory' },
  { key: 'foods', label: 'Foods', icon: 'tabFoods' },
  { key: 'settings', label: 'Settings', icon: 'tabSettings' },
];

export const TAB_BAR_HEIGHT = 56; // without the bottom safe area

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
  onLogFood: () => void;
}

export function TabBar({ active, onChange, onLogFood }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const renderTab = (tab: (typeof TABS)[number]) => (
    <TabItem
      key={tab.key}
      tab={tab}
      on={tab.key === active}
      onPress={() => onChange(tab.key)}
    />
  );

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.lineStrong,
          paddingBottom: insets.bottom + 6,
        },
      ]}
    >
      {TABS.slice(0, 2).map(renderTab)}
      <View style={styles.addSlot}>
        <Press
          onPress={onLogFood}
          scaleTo={0.96}
          accessibilityLabel="Log food"
          style={[
            styles.add,
            {
              backgroundColor: colors.primary,
              borderColor: colors.lineStrong,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Icon name="add" size={28} color={colors.onPrimary} strokeWidth={2} />
        </Press>
      </View>
      {TABS.slice(2).map(renderTab)}
    </View>
  );
}

function TabItem({
  tab,
  on,
  onPress,
}: {
  tab: (typeof TABS)[number];
  on: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const value = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(value, {
      toValue: on ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [on, value]);
  const color = on ? colors.primary : colors.ink3;
  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={tab.label}
    >
      <View style={styles.iconBox}>
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: colors.soft,
              opacity: value,
              transform: [
                {
                  scaleX: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Icon
          name={tab.icon}
          size={22}
          color={color}
          strokeWidth={on ? 1.8 : 1.5}
        />
      </View>
      <Text style={[styles.label, { color }]}>{tab.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT - 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconBox: {
    width: 60,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 30,
    borderRadius: 15,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11.5,
  },
  addSlot: {
    flex: 1,
    alignItems: 'center',
  },
  add: {
    // 60 px button + 5 px ring drawn as a border the colour of the bar
    width: 70,
    height: 70,
    marginTop: -33,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    ...leaf(29, 13),
    elevation: 8,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
});
