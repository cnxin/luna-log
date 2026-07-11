import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidDateKey, normalizeImportedState } from '../src/domain/recordValidation.ts';

const settings = { privacyMode: false, appLockEnabled: false, screenCaptureProtection: true, cycleDays: 28, periodDays: 5, themeStyle: 'classic' as const };

test('accepts a valid wrapped backup and normalizes optional settings', () => {
  const state = normalizeImportedState({
    app: 'Luna Log',
    data: {
      sexRecords: [{ id: 'sex-1', dateTime: '2026-07-10T10:00:00.000Z', count: 1 }],
      periodRecords: [{ id: 'period-1', startDate: '2026-07-01', painLevel: 0, symptoms: [] }],
      symptomRecords: [],
      settings: { themeStyle: 'invalid', cycleDays: 100 },
    },
  }, settings);

  assert.ok(state);
  assert.equal(state.settings.themeStyle, 'classic');
  assert.equal(state.settings.cycleDays, 28);
});

test('rejects malformed dates, duplicate IDs, and reversed period ranges', () => {
  assert.equal(isValidDateKey('2026-02-29'), false);
  assert.equal(isValidDateKey('2028-02-29'), true);

  const duplicateIds = normalizeImportedState({
    sexRecords: [
      { id: 'same', dateTime: '2026-07-10T10:00:00.000Z', count: 1 },
      { id: 'same', dateTime: '2026-07-11T10:00:00.000Z', count: 1 },
    ],
    periodRecords: [],
    symptomRecords: [],
  }, settings);
  assert.equal(duplicateIds, null);

  const reversedPeriod = normalizeImportedState({
    sexRecords: [],
    periodRecords: [{ id: 'period-1', startDate: '2026-07-10', endDate: '2026-07-09', painLevel: 0, symptoms: [] }],
    symptomRecords: [],
  }, settings);
  assert.equal(reversedPeriod, null);
});
