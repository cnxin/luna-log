import { gcm } from '@noble/ciphers/aes.js';
import { fromByteArray, toByteArray } from 'base64-js';

const ENVELOPE_VERSION = 1;
const NONCE_LENGTH = 12;
const AUTHENTICATION_TAG_LENGTH = 16;
const AAD = new TextEncoder().encode('luna-log-app-state-v6');

type EncryptedEnvelope = {
  version: typeof ENVELOPE_VERSION;
  algorithm: 'AES-256-GCM';
  payload: string;
};

function bytesToBase64(bytes: Uint8Array) {
  return fromByteArray(bytes);
}

function base64ToBytes(value: string) {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('Invalid base64 payload');
  }
  return toByteArray(value);
}

function parseEnvelope(value: string): EncryptedEnvelope {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid encrypted payload');
  const envelope = parsed as Partial<EncryptedEnvelope>;
  if (envelope.version !== ENVELOPE_VERSION || envelope.algorithm !== 'AES-256-GCM' || typeof envelope.payload !== 'string') {
    throw new Error('Unsupported encrypted payload');
  }
  return envelope as EncryptedEnvelope;
}

function validateKeyAndNonce(key: Uint8Array, nonce: Uint8Array) {
  if (key.length !== 32) throw new Error('Invalid AES-256 key');
  if (nonce.length !== NONCE_LENGTH) throw new Error('Invalid AES-GCM nonce');
}

export function encryptAppState(plaintext: string, key: Uint8Array, nonce: Uint8Array) {
  validateKeyAndNonce(key, nonce);
  const ciphertext = gcm(key, nonce, AAD).encrypt(new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  const envelope: EncryptedEnvelope = {
    version: ENVELOPE_VERSION,
    algorithm: 'AES-256-GCM',
    payload: bytesToBase64(combined),
  };
  return JSON.stringify(envelope);
}

export function decryptAppState(serializedEnvelope: string, key: Uint8Array) {
  if (key.length !== 32) throw new Error('Invalid AES-256 key');
  const envelope = parseEnvelope(serializedEnvelope);
  const combined = base64ToBytes(envelope.payload);
  if (combined.length < NONCE_LENGTH + AUTHENTICATION_TAG_LENGTH) throw new Error('Encrypted payload is too short');
  const nonce = combined.subarray(0, NONCE_LENGTH);
  const ciphertext = combined.subarray(NONCE_LENGTH);
  const plaintext = gcm(key, nonce, AAD).decrypt(ciphertext);
  return new TextDecoder().decode(plaintext);
}
