// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReports, parseDate } from './parser.js';

test('parses the user sample (Bisha / slash date)', () => {
  const text = `Date: 04/11/2025
Project: Bisha
Robot: 72
Operator: A
Location: mvps 94
Marks: 865`;
  const [e] = parseReports(text);
  assert.equal(e.valid, true);
  assert.equal(e.date, '2025-11-04');
  assert.equal(e.project, 'Bisha');
  assert.equal(e.robotId, '72');
  assert.equal(e.operator, 'A');
  assert.equal(e.location, 'mvps 94');
  assert.equal(e.marks, 865);
  assert.ok(e.warnings.some(w => /Ambiguous/.test(w)));
});

test('parses ISO date without warnings', () => {
  const [e] = parseReports('Date: 2026-04-16\nProject: Alpha\nRobot: R-12\nOperator: Raj\nMarks: 240');
  assert.equal(e.valid, true);
  assert.equal(e.date, '2026-04-16');
  assert.equal(e.robotId, '12');           // "R-12" stripped to "12"
  assert.deepEqual(e.warnings, []);
});

test('parses month-name date', () => {
  const d = parseDate('16 Apr 2026');
  assert.equal(d.iso, '2026-04-16');
});

test('splits blocks by --- and blank lines', () => {
  const text = `Robot: R-1\nOperator: A\nProject: P\nDate: 2026-04-16\nMarks: 10\n---\nRobot: R-2\nOperator: B\nProject: P\nDate: 2026-04-16\nMarks: 20`;
  const rs = parseReports(text);
  assert.equal(rs.length, 2);
  assert.equal(rs[0].robotId, '1');
  assert.equal(rs[1].robotId, '2');
});

test('flags missing required fields', () => {
  const [e] = parseReports('Robot: R-9\nOperator: X\nProject: Alpha\nDate: 2026-04-16');
  assert.equal(e.valid, false);
  assert.ok(e.warnings.some(w => /Missing required field: marks/.test(w)));
});

test('extracts start + end from a single line', () => {
  const [e] = parseReports('Robot: R-3\nOperator: Priya\nProject: Bravo\nDate: 2026-04-16\nMarks: 100\nStart 08:00  End 16:30');
  assert.equal(e.startTime, '08:00');
  assert.equal(e.endTime, '16:30');
  assert.equal(e.shiftDurationMin, 510);
});

test('handles emoji and bullet prefixes', () => {
  const [e] = parseReports('🤖 Robot: R-14\n- Operator: Priya\n• Project: Bravo\nDate: 2026-04-16\nMarks: 185');
  assert.equal(e.valid, true);
  assert.equal(e.robotId, '14');           // "R-14" stripped to "14"
});

test('robot id strips all non-digit characters and normalizes leading zeros', () => {
  const cases = [
    ['R-12',      '12'],
    ['R12',       '12'],
    ['72',        '72'],
    ['Robot #07', '7'],                     // leading zero stripped: "07" == "7"
    ['007',       '7'],                     // multiple leading zeros stripped
    ['0',         '0'],                     // lone zero preserved
    ['  42  ',    '42'],
    ['Unit-5A',   '5'],                     // trailing letters stripped
  ];
  for (const [input, expected] of cases) {
    const [e] = parseReports(`Robot: ${input}\nOperator: X\nProject: P\nDate: 2026-04-16\nMarks: 1`);
    assert.equal(e.robotId, expected, `"${input}" should strip to "${expected}"`);
  }
});

test('robot id with no digits is rejected with a warning', () => {
  const [e] = parseReports('Robot: unknown\nOperator: X\nProject: P\nDate: 2026-04-16\nMarks: 1');
  assert.equal(e.robotId, undefined);
  assert.equal(e.valid, false);
  assert.ok(e.warnings.some(w => /no digits/.test(w)));
});
