import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Multimodal feedback helpers.
 * Apple rule: utility first — only fire on meaningful commit/snap/error moments.
 * Web / unsupported platforms silently no-op.
 */

async function safe(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    await run();
  } catch {
    // Devices without a haptic engine (or Expo Go gaps) should never throw into UI.
  }
}

export function hapticLight() {
  return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticSelection() {
  return safe(() => Haptics.selectionAsync());
}

export function hapticSuccess() {
  return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticWarning() {
  return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export function hapticError() {
  return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
