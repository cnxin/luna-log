import AsyncStorage from '@react-native-async-storage/async-storage';

const legacyStorageKey = 'luna-log-app-v5';
const encryptedStorageKey = 'luna-log-app-v6';
const protectionSettingsKey = 'luna-log-app-v6-protection';

export const exportedStorageKey = legacyStorageKey;

export type ProtectionSettings = {
  appLockEnabled: boolean;
  screenCaptureProtection: boolean;
};

export const defaultProtectionSettings: ProtectionSettings = {
  appLockEnabled: false,
  screenCaptureProtection: true,
};

export type StoredDataResult =
  | { kind: 'empty' }
  | { kind: 'data'; raw: string; source: 'encrypted' | 'legacy' }
  | { kind: 'corrupt'; raw: string; storageKey: typeof legacyStorageKey | typeof encryptedStorageKey }
  | { kind: 'unavailable' };

function normalizeProtectionSettings(value: unknown): ProtectionSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultProtectionSettings;
  const candidate = value as Partial<ProtectionSettings>;
  return {
    appLockEnabled: typeof candidate.appLockEnabled === 'boolean' ? candidate.appLockEnabled : defaultProtectionSettings.appLockEnabled,
    screenCaptureProtection:
      typeof candidate.screenCaptureProtection === 'boolean' ? candidate.screenCaptureProtection : defaultProtectionSettings.screenCaptureProtection,
  };
}

export async function loadProtectionSettings() {
  const raw = await AsyncStorage.getItem(protectionSettingsKey);
  if (!raw) return defaultProtectionSettings;
  try {
    return normalizeProtectionSettings(JSON.parse(raw));
  } catch {
    return defaultProtectionSettings;
  }
}

export async function persistProtectionSettings(settings: ProtectionSettings) {
  await AsyncStorage.setItem(protectionSettingsKey, JSON.stringify(settings));
}

export async function loadStoredAppData(): Promise<StoredDataResult> {
  const legacyRaw = await AsyncStorage.getItem(legacyStorageKey);
  return legacyRaw ? { kind: 'data', raw: legacyRaw, source: 'legacy' } : { kind: 'empty' };
}

export async function persistStoredAppData(serializedState: string) {
  await AsyncStorage.setItem(legacyStorageKey, serializedState);
}

export async function discardStoredAppData(storageKey: string) {
  if (storageKey !== legacyStorageKey && storageKey !== encryptedStorageKey) throw new Error('Invalid storage key');
  await AsyncStorage.removeItem(storageKey);
}
