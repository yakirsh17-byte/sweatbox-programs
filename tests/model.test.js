const test = require('node:test');
const assert = require('node:assert');
const { weekPosition, buildBoard, looksLikeDate } = require('../apps-script/model.js');

const HEADER = ['week', 'card', 'section', 'exercise', 'sets', 'reps', 'superset', 'highlight', 'red'];
const row = (week, exercise, sets, reps, superset = '', red = '') =>
  [week, 'PUSH', '', exercise, sets, reps, superset, '', red];

const tabs = (rows, extra = {}) => ({
  Cards: [['card_id', 'title', 'color', 'screen', 'order', 'tall', 'auto_red', 'fixed'],
    ['PUSH', 'Push', '#fff', '1', '1', 'no', 'yes', 'no']],
  Fixed: [HEADER.slice(1)],
  Settings: [['key', 'value'], ['cycle_1_starts', '2026-11-01']],
  'Cycle 1': [HEADER, ...rows],
  ...extra,
});
const groups = (board) => board.cards[0].sections[0].groups;

test('weeks are counted continuously across months and years', () => {
  const at = (date) => { const p = weekPosition('2026-11-01', date); return [p.cycleDue, p.week]; };
  assert.deepStrictEqual(at('2026-11-28'), [1, 4]);
  assert.deepStrictEqual(at('2026-11-29'), [2, 1]);
  assert.deepStrictEqual(at('2026-12-27'), [3, 1]);
  assert.deepStrictEqual(at('2027-01-03'), [3, 2]);
  assert.strictEqual(weekPosition('2026-11-01', '2026-10-31'), null);
});

test('the previous cycle repeats until the next tab exists', () => {
  const base = tabs([row('1', 'a', '3', '12')]);
  assert.strictEqual(buildBoard(base, '2026-11-29').cycle, 1);
  const next = { ...base, 'Cycle 2': [HEADER, row('1', 'b', '3', '12')] };
  assert.strictEqual(buildBoard(next, '2026-11-29').cycle, 2);
  assert.strictEqual(buildBoard(next, '2026-11-01').cycle, 1);
});

test('red rules and overrides', () => {
  const board = buildBoard(tabs([
    row('1', 'a', '4', '10,10 MAX'),
    row('1', 'b', '3', '12+3', '', 'reps'),
    row('1', 'c', '4', 'max', '', 'none'),
  ]), '2026-11-01');
  assert.deepStrictEqual(groups(board).map((g) => [g.redSets, g.rows[0].redReps]),
    [[true, true], [false, true], [false, false]]);
});

test('superset rows share one group', () => {
  const board = buildBoard(tabs([row('1', 'a', '4', '8', 'A'), row('1', 'b', '4', '10', 'A'),
    row('1', 'c', '3', '12')]), '2026-11-01');
  assert.deepStrictEqual(groups(board).map((g) => g.rows.length), [2, 1]);
});

test('mistakes are reported with their row', () => {
  const board = buildBoard(tabs([row('1', 'a', '4', '8', 'A'), row('1', 'b', '3', '8', 'A'),
    row('7', 'c', '3', '8')]), '2026-11-01');
  assert.strictEqual(board.ok, false);
  assert.match(board.errors.join('\n'), /row 3: superset A has different sets/);
  assert.match(board.warnings.join('\n'), /row 4: week must be 1-4/);
});

test('mistakes outside the week on screen do not block it', () => {
  const unfinished = ['', 'PUSH', '', 'b', '3', '12', '', '', ''];
  const wrongCard = ['2', 'PUSHH', '', 'c', '3', '12', '', '', ''];
  const board = buildBoard(tabs([row('1', 'a', '3', '12'), unfinished, wrongCard]), '2026-11-01');
  assert.strictEqual(board.ok, true);
  assert.strictEqual(board.warnings.length, 2);
  const wrongNow = buildBoard(tabs([row('1', 'a', '3', '12'), ['1', 'PUSHH', '', 'c', '3', '12', '', '', '']]), '2026-11-01');
  assert.strictEqual(wrongNow.ok, false);
});

test('an empty week is an error, not a blank board', () => {
  const board = buildBoard(tabs([row('4', 'a', '3', '12')]), '2026-11-29');
  assert.match(board.errors[0], /no rows for week 1/);
});

test('reps that the sheet turned into a date or time are flagged', () => {
  ['8/12/2026', '2026-12-08', '8.12.2026', '12-Aug', 'Dec 8', '1:00:00', '1:00:00 AM']
    .forEach((reps) => assert.ok(looksLikeDate(reps), reps));
  ['8-12', '12+3', '10,10 MAX', '01:00', '30 sec', '3x10', '2020 m', 'MAX']
    .forEach((reps) => assert.ok(!looksLikeDate(reps), reps));
  const board = buildBoard(tabs([row('1', 'a', '3', '8/12/2026'), row('2', 'b', '3', '1:00:00')]), '2026-11-01');
  assert.strictEqual(board.ok, true);
  assert.match(board.warnings.join('\n'), /row 2: reps "8\/12\/2026" look like a date/);
  assert.match(board.warnings.join('\n'), /row 3: reps "1:00:00"/);
});

test('empty sets on the first superset row get their own message', () => {
  const board = buildBoard(tabs([row('1', 'a', '', '8', 'A'), row('1', 'b', '4', '10', 'A')]), '2026-11-01');
  assert.strictEqual(board.ok, false);
  assert.match(board.errors.join('\n'), /row 3: superset A has empty sets on its first row \(row 2\)/);
  assert.doesNotMatch(board.errors.join('\n'), /different sets/);
});

test('card ids match whatever their capital letters', () => {
  const board = buildBoard(tabs([['1', 'push', '', 'a', '3', '12', '', '', '']]), '2026-11-01');
  assert.strictEqual(board.ok, true);
  assert.strictEqual(board.cards[0].sections[0].groups.length, 1);
  assert.strictEqual(board.cards[0].id, 'PUSH');
  const twice = tabs([row('1', 'a', '3', '12')]);
  twice.Cards.push(['Push', 'Again', '#fff', '1', '2', 'no', 'yes', 'no']);
  assert.match(buildBoard(twice, '2026-11-01').warnings.join('\n'), /Cards row 3: card "Push" is listed twice/);
});

test('cycle_1_starts must be a real Sunday', () => {
  const withStart = (start) => tabs([row('1', 'a', '3', '12')], { Settings: [['key', 'value'], ['cycle_1_starts', start]] });
  assert.match(buildBoard(withStart('2026-11-03'), '2026-11-05').errors[0], /must be a Sunday, but 2026-11-03 is a Tuesday/);
  assert.match(buildBoard(withStart('2026-02-31'), '2026-11-05').errors[0], /real date/);
  assert.strictEqual(buildBoard(withStart('2026-11-01'), '2026-11-05').ok, true);
});
