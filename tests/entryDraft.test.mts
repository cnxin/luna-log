import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEntryDraft, type EntryDraft } from '../src/domain/entryDraft.ts';

const data: EntryDraft['data'] = {
  date: '2026-07-15',
  time: '12:00',
  count: '1',
  duration: '',
  partnerAlias: '',
  sexTypes: [],
  protectionMethods: [],
  place: '',
  mood: '',
  satisfaction: '',
  arousal: false,
  partnerArousal: false,
  orgasm: false,
  toyUsed: false,
  lingerie: false,
  watchedAdultMovie: false,
  syncedWithPartner: false,
  ejaculationPlace: '',
  initiator: 'self',
  positions: [],
  soloTools: [],
  notes: 'draft note',
  periodEnd: '',
  flow: 'medium',
  pain: '0',
  symptoms: [],
};

test('restores a matching, valid entry draft', () => {
  const draft: EntryDraft = { version: 1, type: 'partneredSex', savedAt: '2026-07-15T00:00:00.000Z', data };
  assert.deepEqual(parseEntryDraft(JSON.stringify(draft), 'partneredSex'), data);
});

test('rejects corrupted, mismatched, and incomplete entry drafts', () => {
  const draft: EntryDraft = { version: 1, type: 'partneredSex', savedAt: '2026-07-15T00:00:00.000Z', data };
  assert.equal(parseEntryDraft('not-json', 'partneredSex'), null);
  assert.equal(parseEntryDraft(JSON.stringify(draft), 'soloSex'), null);
  assert.equal(parseEntryDraft(JSON.stringify({ ...draft, version: 2 }), 'partneredSex'), null);
  assert.equal(parseEntryDraft(JSON.stringify({ ...draft, data: { date: data.date } }), 'partneredSex'), null);
});
