import React, { useEffect, type PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { springs, useReducedMotion } from './motion';

type FadeSlideInProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Stagger-friendly enter animation: opacity + slight translateY.
 * Reduced motion: short opacity cross-fade only (no displacement).
 */
export function FadeSlideIn({
  children,
  delay = 0,
  distance = 10,
  style,
}: FadeSlideInProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    if (reducedMotion) {
      progress.value = withDelay(Math.min(delay, 40), withTiming(1, { duration: 160, easing: Easing.out(Easing.ease) }));
      return;
    }
    progress.value = withDelay(delay, withSpring(1, springs.snappy));
  }, [delay, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

type AnimatedBarProps = {
  height: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Spring the bar height from 0 to target. Used by insights chart columns.
 * Reduced motion: short non-bounce timing.
 */
export function AnimatedBar({ height, style, children }: AnimatedBarProps) {
  const reducedMotion = useReducedMotion();
  const animatedHeight = useSharedValue(height);

  useEffect(() => {
    if (reducedMotion) {
      animatedHeight.value = withTiming(height, { duration: 160, easing: Easing.out(Easing.ease) });
      return;
    }
    animatedHeight.value = withSpring(height, springs.snappy);
  }, [animatedHeight, height, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(0, animatedHeight.value),
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

type ScaleOnSelectProps = PropsWithChildren<{
  selected: boolean;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Subtle scale pop when a calendar day becomes selected.
 * Reduced motion: no scale motion.
 */
export function ScaleOnSelect({ selected, style, children }: ScaleOnSelectProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    if (selected) {
      scale.value = withSpring(1.06, springs.press);
      scale.value = withDelay(80, withSpring(1, springs.snappy));
    } else {
      scale.value = withTiming(1, { duration: 120 });
    }
  }, [reducedMotion, scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
