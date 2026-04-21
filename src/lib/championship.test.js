import test from 'node:test';
import assert from 'node:assert/strict';
import { computeChampionship, CHAMPIONSHIP_START } from './championship.js';

test('returns empty array when no entries', () => {
  assert.deepEqual(computeChampionship([]), []);
  assert.deepEqual(computeChampionship(null), []);
});

test('excludes entries before championship start date', () => {
  const entries = [
    { project: 'Bisha', operator: 'A', marks: 100, date: '2026-04-16' }, // before
    { project: 'Bisha', operator: 'A', marks: 50,  date: CHAMPIONSHIP_START },
    { project: 'Bisha', operator: 'B', marks: 30,  date: '2026-05-01' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r.length, 1);
  assert.equal(r[0].leader.name, 'A');
  assert.equal(r[0].leader.marks, 50);
  assert.equal(r[0].runnerUp.name, 'B');
  assert.equal(r[0].runnerUp.marks, 30);
  assert.equal(r[0].totalMarks, 80);
});

test('single operator in a project returns null runner-up', () => {
  const entries = [
    { project: 'Marjan', operator: 'Saleh', marks: 500, date: '2026-04-17' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r[0].leader.name, 'Saleh');
  assert.equal(r[0].runnerUp, null);
  assert.equal(r[0].operatorCount, 1);
  assert.equal(r[0].margin, null);
});

test('multiple projects produce separate rows sorted by total marks desc', () => {
  const entries = [
    { project: 'Bisha',   operator: 'A', marks: 100, date: '2026-04-18' },
    { project: 'Jafurah', operator: 'B', marks: 200, date: '2026-04-18' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r.length, 2);
  assert.equal(r[0].project, 'Jafurah'); // 200 > 100
  assert.equal(r[1].project, 'Bisha');
});

test('project filter narrows result to one project', () => {
  const entries = [
    { project: 'Bisha',   operator: 'A', marks: 100, date: '2026-04-18' },
    { project: 'Jafurah', operator: 'B', marks: 200, date: '2026-04-18' },
  ];
  const r = computeChampionship(entries, { project: 'Bisha' });
  assert.equal(r.length, 1);
  assert.equal(r[0].project, 'Bisha');
});

test('project filter is case-insensitive', () => {
  const entries = [
    { project: 'Bisha', operator: 'A', marks: 100, date: '2026-04-18' },
  ];
  assert.equal(computeChampionship(entries, { project: 'bisha' }).length, 1);
  assert.equal(computeChampionship(entries, { project: 'BISHA' }).length, 1);
  assert.equal(computeChampionship(entries, { project: 'Bisha' }).length, 1);
});

test('aggregates marks across many entries per operator', () => {
  const entries = [
    { project: 'Bisha', operator: 'A', marks: 40, date: '2026-04-18' },
    { project: 'Bisha', operator: 'A', marks: 60, date: '2026-04-19' },
    { project: 'Bisha', operator: 'B', marks: 50, date: '2026-04-18' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r[0].leader.name, 'A');
  assert.equal(r[0].leader.marks, 100);
  assert.equal(r[0].runnerUp.name, 'B');
  assert.equal(r[0].runnerUp.marks, 50);
});

test('ties break alphabetically for deterministic ordering', () => {
  const entries = [
    { project: 'Bisha', operator: 'Zain', marks: 50, date: '2026-04-18' },
    { project: 'Bisha', operator: 'Amir', marks: 50, date: '2026-04-18' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r[0].leader.name, 'Amir');   // alphabetically first
  assert.equal(r[0].runnerUp.name, 'Zain');
});

test('computes margin as leader.marks - runnerUp.marks', () => {
  const entries = [
    { project: 'Bisha', operator: 'A', marks: 100, date: '2026-04-18' },
    { project: 'Bisha', operator: 'B', marks: 30,  date: '2026-04-18' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r[0].margin, 70);
});

test('handles string marks and missing fields gracefully', () => {
  const entries = [
    { project: 'Bisha', operator: 'A', marks: '100', date: '2026-04-18' },
    { project: 'Bisha', operator: 'A', marks: null,  date: '2026-04-18' },
    { /* no project */ operator: 'X', marks: 50, date: '2026-04-18' },
    { project: 'Bisha', /* no operator */ marks: 50, date: '2026-04-18' },
  ];
  const r = computeChampionship(entries);
  assert.equal(r[0].leader.name, 'A');
  assert.equal(r[0].leader.marks, 100); // null coerced to 0, '100' coerced to 100
  assert.equal(r[0].operatorCount, 1);  // entries without project/operator skipped
});
