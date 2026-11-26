/** Creates the SweatBox tabs. Run setupSheet once from the Apps Script editor. */
const CARD_IDS = ['PUSH', 'PULL', 'LEGS', 'GLUTES', 'A1', 'A2', 'B1', 'B2', 'C1', 'ABS'];

const CARDS = [
  // card_id, title, color, screen, order, tall, auto_red, fixed_program
  ['PUSH', 'PUSH · חזה, כתפיים, יד אחורית', '#46b06a', 1, 1, 'no', 'yes', ''],
  ['PULL', 'PULL · גב, יד קדמית', '#c4475a', 1, 2, 'no', 'yes', ''],
  ['PROTOCOL', 'פרוטוקול למתאמן המתחיל', '#f2c233', 1, 3, 'yes', 'no', 'PROTOCOL-1'],
  ['LEGS', 'LEGS · שרשרת קדמית ואחורית', '#4c7dff', 1, 4, 'no', 'yes', ''],
  ['GLUTES', 'GLUTES & ABS', '#e05bd0', 1, 5, 'no', 'yes', ''],
  ['A1', 'A1 · FULL BODY · דגש פלג גוף תחתון', '#4c7dff', 2, 1, 'no', 'yes', ''],
  ['A2', 'A2 · LOWER BODY · דגש ישבן', '#e05bd0', 2, 2, 'no', 'yes', ''],
  ['B2', 'B2 · UPPER BODY', '#ff8a3d', 2, 3, 'no', 'yes', ''],
  ['B1', 'B1 · FULL BODY · דגש פלג גוף עליון', '#46b06a', 2, 4, 'no', 'yes', ''],
  ['C1', 'C1 · FULL BODY · כללי', '#9b6bff', 2, 5, 'no', 'yes', ''],
  ['ABS', 'תכנית בטן שבועית', '#e8e8ee', 2, 6, 'no', 'yes', ''],
];

const TABS = {
  Cards: [['card_id', 'title', 'color', 'screen', 'order', 'tall', 'auto_red', 'fixed_program'], ...CARDS],
  Programs: [['program_id', 'section', 'exercise', 'sets', 'reps', 'superset', 'highlight', 'red']],
  Schedule: [['starts_on', 'week', ...CARD_IDS]],
  Settings: [['key', 'value'], ['brand', 'SWEATBOX'], ['screen_1_label', 'SPLIT PROGRAM'],
    ['screen_2_label', 'FULL BODY PROGRAMS'], ['cycle_length', 4]],
};

function setupSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  // Check everything first so a failed run changes nothing.
  const taken = Object.keys(TABS).filter((name) => book.getSheetByName(name));
  if (taken.length) throw new Error('These tabs already exist: ' + taken.join(', '));

  Object.entries(TABS).forEach(([name, rows]) => {
    const sheet = book.insertSheet(name);
    // Plain text, so that 8-12 or 01:00 are not turned into dates or times.
    if (name === 'Programs') sheet.getRange('A:H').setNumberFormat('@');
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  const schedule = book.getSheetByName('Schedule');
  schedule.getRange('A2:A').setNumberFormat('dd/mm/yyyy');
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(book.getSheetByName('Programs').getRange('A2:A'), true)
    .setAllowInvalid(false)
    .build();
  schedule.getRange(2, 3, schedule.getMaxRows() - 1, CARD_IDS.length).setDataValidation(rule);
}
