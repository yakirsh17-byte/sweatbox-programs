/** The SweatBox menu in the sheet. */
const SITE_URL = 'https://yakirsh17-byte.github.io/sweatbox-programs/';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('SweatBox')
    .addItem('New cycle', 'newCycle')
    .addItem('Check and preview', 'checkData')
    .addToUi();
}

/** Reports problems for a date and gives the preview links. */
function checkData() {
  const ui = SpreadsheetApp.getUi();
  const answer = ui.prompt('Check which date?', 'YYYY-MM-DD, or leave empty for today', ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  const date = answer.getResponseText().trim() || today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    ui.alert('Use the format YYYY-MM-DD.');
    return;
  }
  const board = buildBoard(readTabs(), date);
  ui.alert([
    board.ok ? `OK: cycle ${board.cycle}, week ${board.week}` : 'NOT SHOWN. Fix these:',
    ...(board.errors || []),
    ...board.warnings.map((warning) => 'Warning: ' + warning),
    '',
    `Screen 1: ${SITE_URL}?screen=1&date=${date}`,
    `Screen 2: ${SITE_URL}?screen=2&date=${date}`,
  ].join('\n'));
}
