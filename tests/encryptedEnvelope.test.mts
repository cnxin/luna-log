import assert from 'node:assert/strict';
import test from 'node:test';
import { decryptAppState, encryptAppState } from '../src/domain/encryptedEnvelope.ts';

const key = new Uint8Array(Array.from({ length: 32 }, (_, index) => index));
const nonce = new Uint8Array(Array.from({ length: 12 }, (_, index) => index + 32));

test('encrypts application state with authenticated AES-256-GCM', () => {
  const plaintext = JSON.stringify({ notes: 'sensitive data', count: 2 });
  const encrypted = encryptAppState(plaintext, key, nonce);

  assert.notEqual(encrypted, plaintext);
  assert.equal(decryptAppState(encrypted, key), plaintext);
});

test('rejects tampered encrypted application state', () => {
  const encrypted = encryptAppState('private', key, nonce);
  const payload = JSON.parse(encrypted) as { payload: string };
  const tampered = JSON.stringify({ ...JSON.parse(encrypted), payload: `${payload.payload.slice(0, -2)}AA` });

  assert.throws(() => decryptAppState(tampered, key));
  assert.throws(() => decryptAppState(encrypted, new Uint8Array(32).fill(1)));
});
