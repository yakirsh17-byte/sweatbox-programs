/** Web app endpoint. GET returns this week's board; ?date=YYYY-MM-DD previews another week. */
const TIME_ZONE = 'Asia/Jerusalem';

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
  return ContentService.createTextOutput(JSON.stringify(buildBoard(readTabs(), date)))
    .setMimeType(ContentService.MimeType.JSON);
}
