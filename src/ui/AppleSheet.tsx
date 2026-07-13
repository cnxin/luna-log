import React, { useCallback, useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { springs, useReducedMotion, useReducedTransparency } from './motion';
import { hapticLight } from './haptics';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_MAX_HEIGHT = SCREEN_HEIGHT * 0.86;
const CLOSE_THRESHOLD = 0.35;
const FLICK_VELOCITY = 700;

type AppleSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  maxHeight?: number;
  handleColor?: string;
  backgroundColor?: string;
  scrimColor?: string;
  header?: ReactNode;
  style?: ViewStyle;
}>;

/**
 * Interruptible bottom sheet with velocity handoff, momentum projection, and rubber-banding.
 * Aligns with Apple Design principles from WWDC 2018 "Designing Fluid Interfaces".
 */
export function AppleSheet({
  visible,
  onClose,
  maxHeight = DEFAULT_MAX_HEIGHT,
  handleColor = 'rgba(99,110,114,0.28)',
  backgroundColor = 'rgba(255,255,255,0.94)',
  scrimColor = 'rgba(20,24,38,0.42)',
  header,
  style,
  children,
}: AppleSheetProps) {
  const reducedMotion = useReducedMotion();
  const reducedTransparency = useReducedTransparency();
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(DEFAULT_MAX_HEIGHT);

  const translateY = useSharedValue(DEFAULT_MAX_HEIGHT);
  const scrimOpacity = useSharedValue(0);
  const startY = useSharedValue(0);
  const currentHeight = useSharedValue(DEFAULT_MAX_HEIGHT);
  const reducedMotionSV = useSharedValue(reducedMotion);

  useEffect(() => {
    reducedMotionSV.value = reducedMotion;
  }, [reducedMotion, reducedMotionSV]);

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  const snapFeedback = useCallback(() => {
    void hapticLight();
  }, []);

  const unmount = useCallback(() => {
    setMounted(false);
  }, []);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reducedMotion) {
        translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
        scrimOpacity.value = withTiming(1, { duration: 200 });
      } else {
        // Continue from current presentation value when reopening mid-flight
        if (translateY.value >= currentHeight.value * 0.9) {
          translateY.value = currentHeight.value;
        }
        translateY.value = withSpring(0, springs.snappy);
        scrimOpacity.value = withTiming(1, { duration: 280 });
      }
      return;
    }

    if (!mounted) return;

    if (reducedMotion) {
      translateY.value = withTiming(currentHeight.value, { duration: 180 }, (finished) => {
        if (finished) runOnJS(unmount)();
      });
      scrimOpacity.value = withTiming(0, { duration: 180 });
    } else {
      translateY.value = withSpring(currentHeight.value, springs.snappy, (finished) => {
        if (finished) runOnJS(unmount)();
      });
      scrimOpacity.value = withTiming(0, { duration: 240 });
    }
  }, [visible, reducedMotion, mounted, translateY, scrimOpacity, currentHeight, unmount]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(8)
    .onStart(() => {
      'worklet';
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      const height = currentHeight.value;
      let next = startY.value + event.translationY;
      // Rubber-band above open
      if (next < 0) {
        const overshoot = -next;
        next = -((overshoot * height * 0.55) / (height + 0.55 * overshoot));
      }
      // Soft resist past closed
      if (next > height) {
        const overshoot = next - height;
        next = height + (overshoot * height * 0.55) / (height + 0.55 * overshoot);
      }
      translateY.value = next;
      const progress = 1 - Math.min(1, Math.max(0, next / height));
      scrimOpacity.value = progress;
    })
    .onEnd((event) => {
      'worklet';
      const height = currentHeight.value;
      const velocity = event.velocityY;
      // Apple momentum projection
      const projected = translateY.value + (velocity / 1000) * 0.998 / (1 - 0.998);
      const shouldClose = projected > height * CLOSE_THRESHOLD || velocity > FLICK_VELOCITY;
      const target = shouldClose ? height : 0;
      runOnJS(snapFeedback)();

      if (reducedMotionSV.value) {
        translateY.value = withTiming(target, { duration: 180 }, (finished) => {
          if (finished && shouldClose) runOnJS(closeSheet)();
        });
        scrimOpacity.value = withTiming(shouldClose ? 0 : 1, { duration: 180 });
      } else {
        translateY.value = withSpring(target, { ...springs.snappy, velocity }, (finished) => {
          if (finished && shouldClose) runOnJS(closeSheet)();
        });
        scrimOpacity.value = withTiming(shouldClose ? 0 : 1, { duration: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  if (!mounted) return null;

  const solidBg = reducedTransparency ? '#ffffff' : backgroundColor;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={closeSheet} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.scrim, { backgroundColor: scrimColor }, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight,
              backgroundColor: reducedTransparency || Platform.OS === 'web' ? solidBg : 'transparent',
            },
            style,
            sheetStyle,
          ]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - sheetHeight) > 2) {
              setSheetHeight(h);
              currentHeight.value = h;
              if (!visible) {
                translateY.value = h;
              }
            }
          }}
        >
          {!reducedTransparency && Platform.OS !== 'web' ? (
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          ) : null}
          {!reducedTransparency && Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webMaterial]} />
          ) : null}

          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
              {header}
            </Animated.View>
          </GestureDetector>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#141826',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 24,
  },
  webMaterial: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    // @ts-expect-error web-only CSS property
    backdropFilter: 'blur(28px) saturate(180%)',
  },
  handleArea: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 12,
  },
  content: {
    flexShrink: 1,
  },
});
