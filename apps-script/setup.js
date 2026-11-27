/** Creates the SweatBox tabs. Run setupSheet once from the Apps Script editor. */
const CARDS = [
  // card_id, title, color, screen, order, tall, auto_red, fixed
  ['PUSH', 'PUSH · חזה, כתפיים, יד אחורית', '#46b06a', 1, 1, 'no', 'yes', 'no'],
  ['PULL', 'PULL · גב, יד קדמית', '#c4475a', 1, 2, 'no', 'yes', 'no'],
  ['PROTOCOL', 'פרוטוקול למתאמן המתחיל', '#f2c233', 1, 3, 'yes', 'no', 'yes'],
  ['LEGS', 'LEGS · שרשרת קדמית ואחורית', '#4c7dff', 1, 4, 'no', 'yes', 'no'],
  ['GLUTES', 'GLUTES & ABS', '#e05bd0', 1, 5, 'no', 'yes', 'no'],
  ['A1', 'A1 · FULL BODY · דגש פלג גוף תחתון', '#4c7dff', 2, 1, 'no', 'yes', 'no'],
  ['A2', 'A2 · LOWER BODY · דגש ישבן', '#e05bd0', 2, 2, 'no', 'yes', 'no'],
  ['B2', 'B2 · UPPER BODY', '#ff8a3d', 2, 3, 'no', 'yes', 'no'],
  ['B1', 'B1 · FULL BODY · דגש פלג גוף עליון', '#46b06a', 2, 4, 'no', 'yes', 'no'],
  ['C1', 'C1 · FULL BODY · כללי', '#9b6bff', 2, 5, 'no', 'yes', 'no'],
  ['ABS', 'תכנית בטן שבועית', '#e8e8ee', 2, 6, 'no', 'yes', 'no'],
];

const EXERCISE_COLUMNS = ['section', 'exercise', 'sets', 'reps', 'superset', 'highlight', 'red'];
const CYCLE_HEADER = ['week', 'card', ...EXERCISE_COLUMNS];

const TABS = {
  Cards: [['card_id', 'title', 'color', 'screen', 'order', 'tall', 'auto_red', 'fixed'], ...CARDS],
  Fixed: [['card', ...EXERCISE_COLUMNS]],
  'Cycle 1': [CYCLE_HEADER],
  Settings: [['key', 'value'], ['brand', 'SWEATBOX'], ['screen_1_label', 'SPLIT PROGRAM'],
    ['screen_2_label', 'FULL BODY PROGRAMS'],
    // Sunday on which week 1 of Cycle 1 began. Weeks are counted continuously from here.
    ['cycle_1_starts', '2026-11-01']],
};

/** Highest N among the tabs named "Cycle N". */
function lastCycleNumber(book) {
  const numbers = book.getSheets()
    .map((sheet) => /^Cycle (\d+)$/.exec(sheet.getName()))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return Math.max(0, ...numbers);
}

/** Copies the latest cycle tab, with its formatting, under the next number. */
function newCycle() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const last = lastCycleNumber(book);
  if (!last) throw new Error('No cycle tab to copy. Run setupSheet first.');
  const copy = book.getSheetByName('Cycle ' + last).copyTo(book).setName('Cycle ' + (last + 1));
  book.setActiveSheet(copy);
}

function setupSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  // Check everything first so a failed run changes nothing.
  const taken = Object.keys(TABS).filter((name) => book.getSheetByName(name));
  if (taken.length) throw new Error('These tabs already exist: ' + taken.join(', '));

  Object.entries(TABS).forEach(([name, rows]) => {
    const sheet = book.insertSheet(name);
    // Plain text, so that 8-12, 01:00 or the start date stay exactly as typed.
    if (name !== 'Cards') sheet.getRange('A:I').setNumberFormat('@');
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  const cycle = book.getSheetByName('Cycle 1');
  const dropdown = (column, values) => cycle.getRange(2, column, cycle.getMaxRows() - 1, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true).setAllowInvalid(false).build());
  dropdown(1, ['1', '2', '3', '4']);
  dropdown(2, CARDS.filter((card) => card[7] === 'no').map((card) => card[0]));
}
