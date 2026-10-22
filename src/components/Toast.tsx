// Dark toast above the tab bar. With an action ("Undo") it stays ~5 s, otherwise ~2.3 s.
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fixed, fonts, leaf } from '../theme';
import { Icon } from './Icon';

export interface ToastMessage {
  id: number; // a new id replays the animation, even for the same text
  title: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
}

interface Props {
  message: ToastMessage | null;
  bottom: number;
  onHide: () => void;
}

export function Toast({ message, bottom, onHide }: Props) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) {
      return;
    }
    value.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration: 380,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.delay(message.action ? 5000 : 2000),
      Animated.timing(value, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => finished && onHide());
    return () => animation.stop();
  }, [message, value, onHide]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom,
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Icon name="tick" size={22} color={fixed.leafGreen} strokeWidth={1.5} />
      <View style={styles.texts}>
        <Text style={styles.title}>{message.title}</Text>
        {!!message.detail && (
          <Text style={styles.detail} numberOfLines={1}>
            {message.detail}
          </Text>
        )}
      </View>
      {message.action && (
        <Pressable
          onPress={() => {
            message.action!.onPress();
            onHide();
          }}
          accessibilityRole="button"
          style={styles.action}
        >
          <Text style={styles.actionLabel}>{message.action.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    backgroundColor: fixed.toast,
    ...leaf(20, 6),
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  texts: {
    flex: 1,
    paddingVertical: 4,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: fixed.cream,
  },
  detail: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: 'rgba(246,241,231,0.75)',
  },
  action: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246,241,231,0.12)',
  },
  actionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: fixed.toastAction,
  },
});
