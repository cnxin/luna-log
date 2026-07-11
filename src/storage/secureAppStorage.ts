import AsyncStorage from '@react-native-async-storage/async-storage';
import { fromByteArray, toByteArray } from 'base64-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { decryptAppState, encryptAppState } from '../domain/encryptedEnvelope';

const legacyStorageKey = 'luna-log-app-v5';
const encryptedStorageKey = 'luna-log-app-v6';
const encryptionKeyName = 'luna-log-app-v6-data-key';
const protectionSettingsKey = 'luna-log-app-v6-protection';
const encryptionKeyOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const exportedStorageKey = encryptedStorageKey;

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

let cachedDataKey: Uint8Array | null = null;
let dataKeyPromise: Promise<Uint8Array> | null = null;

function isNativeSecureStoragePlatform() {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

async function secureStorageAvailable() {
  return isNativeSecureStoragePlatform() && (await SecureStore.isAvailableAsync());
}

function decodeBase64(value: string) {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid stored key');
  return toByteArray(value);
}

function encodeBase64(bytes: Uint8Array) {
  return fromByteArray(bytes);
}

async function readExistingDataKey() {
  if (cachedDataKey) return cachedDataKey;
  const encoded = await SecureStore.getItemAsync(encryptionKeyName, encryptionKeyOptions);
  if (!encoded) return null;
  const key = decodeBase64(encoded);
  if (key.length !== 32) throw new Error('Invalid stored key');
  cachedDataKey = key;
  return key;
}

async function getOrCreateDataKey() {
  if (cachedDataKey) return cachedDataKey;
  if (dataKeyPromise) return dataKeyPromise;
  dataKeyPromise = (async () => {
    const existingKey = await readExistingDataKey();
    if (existingKey) return existingKey;
    const generatedKey = await Crypto.getRandomBytesAsync(32);
    await SecureStore.setItemAsync(encryptionKeyName, encodeBase64(generatedKey), encryptionKeyOptions);
    cachedDataKey = generatedKey;
    return generatedKey;
  })();
  try {
    return await dataKeyPromise;
  } finally {
    dataKeyPromise = null;
  }
}

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
  const encryptedRaw = await AsyncStorage.getItem(encryptedStorageKey);
  const secureStorageIsAvailable = await secureStorageAvailable();
  if (encryptedRaw) {
    if (!secureStorageIsAvailable) return { kind: 'unavailable' };
    try {
      const key = await readExistingDataKey();
      if (!key) return { kind: 'corrupt', raw: encryptedRaw, storageKey: encryptedStorageKey };
      return { kind: 'data', raw: decryptAppState(encryptedRaw, key), source: 'encrypted' };
    } catch {
      return { kind: 'corrupt', raw: encryptedRaw, storageKey: encryptedStorageKey };
    }
  }

  const legacyRaw = await AsyncStorage.getItem(legacyStorageKey);
  if (legacyRaw) return { kind: 'data', raw: legacyRaw, source: 'legacy' };
  return secureStorageIsAvailable || !isNativeSecureStoragePlatform() ? { kind: 'empty' } : { kind: 'unavailable' };
}

export async function persistStoredAppData(serializedState: string) {
  if (!isNativeSecureStoragePlatform()) {
    await AsyncStorage.setItem(legacyStorageKey, serializedState);
    return;
  }
  if (!(await secureStorageAvailable())) throw new Error('Secure storage is unavailable');
  const key = await getOrCreateDataKey();
  const nonce = await Crypto.getRandomBytesAsync(12);
  const encrypted = encryptAppState(serializedState, key, nonce);
  await AsyncStorage.setItem(encryptedStorageKey, encrypted);
  await AsyncStorage.removeItem(legacyStorageKey);
}

export async function discardStoredAppData(storageKey: string) {
  if (storageKey !== legacyStorageKey && storageKey !== encryptedStorageKey) throw new Error('Invalid storage key');
  await AsyncStorage.removeItem(storageKey);
}
