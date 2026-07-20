import assert from 'node:assert/strict';
import test from 'node:test';
import { filterTimelineBySearch } from '../src/domain/timelineSearch.ts';

const records = [
  { title: 'Partnered intimacy', meta: ['2026-07-15', 'Mood calm'], notes: 'Weekend note', searchText: ['Alex', 'Home'] },
  { title: 'Period record', meta: ['Cramps'], notes: '', searchText: ['Light flow'] },
];

test('searches local timeline fields without changing an empty query', () => {
  assert.equal(filterTimelineBySearch(records, ''), records);
  assert.deepEqual(filterTimelineBySearch(records, ' alex '), [records[0]]);
  assert.deepEqual(filterTimelineBySearch(records, 'weekend'), [records[0]]);
  assert.deepEqual(filterTimelineBySearch(records, 'cramps'), [records[1]]);
  assert.deepEqual(filterTimelineBySearch(records, 'missing'), []);
});
