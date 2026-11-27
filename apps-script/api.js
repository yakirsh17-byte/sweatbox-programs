/** @OnlyCurrentDoc */

/** Web app endpoint. GET returns this week's board; ?date=YYYY-MM-DD previews another week. */
const TIME_ZONE = 'Asia/Jerusalem';
// Raise this, and EXPECTED_SCRIPT_VERSION in web/config.js, whenever any Apps Script file changes.
const SCRIPT_VERSION = 3;

function readTabs() {
  const tabs = {};
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach((sheet) => {
    const name = sheet.getName();
    // Display values keep everything as the text you see in the sheet.
    if (/^(Cards|Fixed|Settings|Cycle \d+)$/.test(name)) tabs[name] = sheet.getDataRange().getDisplayValues();
  });
  return tabs;
}

const today = () => Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');

function doGet(e) {
  const asked = e && e.parameter && e.parameter.date;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(asked || '') ? asked : today();
  return ContentService.createTextOutput(JSON.stringify({ version: SCRIPT_VERSION, ...buildBoard(readTabs(), date) }))
    .setMimeType(ContentService.MimeType.JSON);
}
