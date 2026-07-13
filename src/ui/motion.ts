import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState } from 'react';

// Apple Design spring tokens
// https://developer.apple.com/videos/play/wwdc2018/803/
// Mapped to Reanimated spring config (stiffness/damping/mass)

export const springs = {
  // Critically damped, no overshoot — UI repositioning, drawers, sheets
  // Apple: damping 1.0, response 0.35s
  snappy: {
    stiffness: 280,
    damping: 22,
    mass: 0.9,
  },
  // Slight bounce — momentum-driven interactions (flick, throw)
  // Apple: damping ~0.8, response 0.3s
  bouncy: {
    stiffness: 220,
    damping: 16,
    mass: 1,
  },
  // Micro feedback — button press
  press: {
    stiffness: 500,
    damping: 28,
    mass: 0.6,
  },
  // Reduced-motion friendly: no bounce, settles quickly via timing instead of spring
  reduced: {
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
} as const;

// Reduced motion hook
let reducedMotionCache: boolean | null = null;

function subscribeReduceMotion(listener: (enabled: boolean) => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => listener(media.matches);
    listener(media.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }

  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      reducedMotionCache = enabled;
      listener(enabled);
    })
    .catch(() => {
      reducedMotionCache = false;
      listener(false);
    });

  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    reducedMotionCache = enabled;
    listener(enabled);
  });

  return () => sub?.remove();
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => reducedMotionCache ?? false);

  useEffect(() => {
    return subscribeReduceMotion((enabled) => {
      reducedMotionCache = enabled;
      setReduced(enabled);
    });
  }, []);

  return reduced;
}

// Reduced transparency hook
let reducedTransparencyCache: boolean | null = null;

function subscribeReduceTransparency(listener: (enabled: boolean) => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const media = window.matchMedia('(prefers-reduced-transparency: reduce)');
    const onChange = () => listener(media.matches);
    listener(media.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }

  const api = AccessibilityInfo as typeof AccessibilityInfo & {
    isReduceTransparencyEnabled?: () => Promise<boolean>;
  };

  if (typeof api.isReduceTransparencyEnabled === 'function') {
    api
      .isReduceTransparencyEnabled()
      .then((enabled) => {
        reducedTransparencyCache = enabled ?? false;
        listener(enabled ?? false);
      })
      .catch(() => {
        reducedTransparencyCache = false;
        listener(false);
      });
  } else {
    listener(false);
  }

  const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
    reducedTransparencyCache = enabled;
    listener(enabled);
  });

  return () => sub?.remove();
}

export function useReducedTransparency(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => reducedTransparencyCache ?? false);

  useEffect(() => {
    return subscribeReduceTransparency((enabled) => {
      reducedTransparencyCache = enabled;
      setReduced(enabled);
    });
  }, []);

  return reduced;
}

// Apple momentum projection for snap decisions
// From WWDC 2018 sample code
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

// Rubber-band resistance at boundaries
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
