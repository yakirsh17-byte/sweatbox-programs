/** Connection test endpoint. Returns row counts only, no program content. */
function doGet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const rows = {};
  ['Cards', 'Fixed', 'Cycle 1', 'Settings'].forEach((name) => {
    const sheet = book.getSheetByName(name);
    rows[name] = sheet ? Math.max(sheet.getLastRow() - 1, 0) : null;
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
