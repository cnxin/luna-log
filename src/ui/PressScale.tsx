import React, { type PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs, useReducedMotion } from './motion';

type PressScaleProps = PropsWithChildren<{
  scale?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  pressableProps?: Omit<PressableProps, 'style' | 'disabled' | 'onPressIn' | 'onPressOut'>;
}>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Touch-down scale feedback wrapper
 * Apple Design: respond on pointer-down, not release
 */
export function PressScale({
  children,
  scale = 0.96,
  disabled = false,
  style,
  pressableProps = {},
}: PressScaleProps) {
  const reducedMotion = useReducedMotion();
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = () => {
    if (disabled || reducedMotion) return;
    scaleValue.value = withSpring(scale, springs.press);
  };

  const handlePressOut = () => {
    if (disabled || reducedMotion) return;
    scaleValue.value = withSpring(1, springs.press);
  };

  return (
    <AnimatedPressable
      {...pressableProps}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
