import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeProject, canonicalizeOperator, canonicalizeEntry } from './canonicalize.js';

test('project: case-insensitive match keeps existing casing', () => {
  const r = canonicalizeProject('bisha', ['Bisha', 'Alpha']);
  assert.equal(r.value, 'Bisha');
  assert.equal(r.warnings.length, 1);
});

test('project: new name has no match, returns trimmed as-is', () => {
  const r = canonicalizeProject('  Gamma  ', ['Alpha']);
  assert.equal(r.value, 'Gamma');
  assert.deepEqual(r.warnings, []);
});

test('project: exact match with same casing produces no warning', () => {
  const r = canonicalizeProject('Bisha', ['Bisha']);
  assert.equal(r.value, 'Bisha');
  assert.deepEqual(r.warnings, []);
});

test('operator: exact case-insensitive match uses existing form', () => {
  const r = canonicalizeOperator('raj', ['Raj', 'Priya']);
  assert.equal(r.value, 'Raj');
});

test('operator: first-name token matches existing full name (Raj -> Raj Kumar)', () => {
  const r = canonicalizeOperator('Raj', ['Raj Kumar', 'Priya']);
  assert.equal(r.value, 'Raj Kumar');
  assert.ok(r.warnings[0].includes('same first name'));
});

test('operator: full name matches existing first name (Raj Kumar -> Raj)', () => {
  const r = canonicalizeOperator('Raj Kumar', ['Raj', 'Priya']);
  assert.equal(r.value, 'Raj');
  assert.ok(r.warnings[0].includes('same first name'));
});

test('operator: no match, new operator returned trimmed', () => {
  const r = canonicalizeOperator('Arjun', ['Raj', 'Priya']);
  assert.equal(r.value, 'Arjun');
  assert.deepEqual(r.warnings, []);
});

test('operator: ambiguous first token flags warning', () => {
  const r = canonicalizeOperator('Raj', ['Raj Kumar', 'Raj Patel']);
  assert.equal(r.value, 'Raj Kumar');
  assert.ok(/ambiguous/i.test(r.warnings[0]));
});

test('operator: empty string stays empty', () => {
  const r = canonicalizeOperator('', ['Raj']);
  assert.equal(r.value, '');
  assert.deepEqual(r.warnings, []);
});

test('canonicalizeEntry: normalizes both fields and preserves other warnings', () => {
  const entry = {
    project: 'bisha',
    operator: 'Raj',
    marks: 100,
    warnings: ['Ambiguous date "04/11/2025"…'],
  };
  const r = canonicalizeEntry(entry, { projects: ['Bisha'], operators: ['Raj Kumar'] });
  assert.equal(r.project, 'Bisha');
  assert.equal(r.operator, 'Raj Kumar');
  // Should keep original + add two new warnings
  assert.equal(r.warnings.length, 3);
  assert.ok(r.warnings[0].startsWith('Ambiguous date'));
});
