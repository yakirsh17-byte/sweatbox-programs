const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Minimal in-memory stand-in for the Google services the scripts use.
function fakeGoogle() {
  const tabs = {};
  const sheet = () => {
    const cells = [];
    const range = (row, col) => {
      const r = {
        setValues(values) {
          values.forEach((line, i) => {
            assert.strictEqual(line.length, values[0].length);
            cells[row - 1 + i] = line;
          });
          return r;
        },
        setNumberFormat: () => r, setFontWeight: () => r, setDataValidation: () => r,
      };
      return r;
    };
    return {
      cells,
      getRange: (a, b) => (typeof a === 'string' ? range(1, 1) : range(a, b)),
      setFrozenRows() {}, getMaxRows: () => 1000, getLastRow: () => cells.length,
    };
  };
  const rule = { requireValueInRange: () => rule, setAllowInvalid: () => rule, build: () => ({}) };
  return {
    tabs,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (n) => tabs[n] || null,
        insertSheet: (n) => (tabs[n] = sheet()),
      }),
      newDataValidation: () => rule,
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType: () => text }),
    },
  };
}

function load(google) {
  const context = vm.createContext(google);
  ['setup.js', 'api.js'].forEach((f) =>
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script', f), 'utf8'), context));
  return context;
}

test('setup creates the tabs and the endpoint reports them', () => {
  const app = load(fakeGoogle());
  app.setupSheet();
  const reply = JSON.parse(app.doGet());
  assert.deepStrictEqual(reply, { ok: true, rows: { Cards: 11, Programs: 0, Schedule: 0, Settings: 4 } });
});

test('setup refuses to run twice', () => {
  const app = load(fakeGoogle());
  app.setupSheet();
  assert.throws(() => app.setupSheet(), /already exist/);
});
