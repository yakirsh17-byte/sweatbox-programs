const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Minimal in-memory stand-in for the Google services the scripts use.
function fakeGoogle() {
  const tabs = {};
  const sheet = (name, cells = []) => {
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
      getName: () => name,
      copyTo: () => {
        const copy = sheet(name + ' copy', cells.map((line) => [...line]));
        copy.setName = (to) => { tabs[to] = sheet(to, copy.cells); return tabs[to]; };
        return copy;
      },
      getRange: (a, b) => (typeof a === 'string' ? range(1, 1) : range(a, b)),
      setFrozenRows() {},
      getDataRange: () => ({ getDisplayValues: () => cells.map((line) => line.map(String)) }),
      getMaxRows: () => 1000, getLastRow: () => cells.length,
    };
  };
  const rule = { requireValueInList: () => rule, setAllowInvalid: () => rule, build: () => ({}) };
  return {
    tabs,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (n) => tabs[n] || null,
        insertSheet: (n) => (tabs[n] = sheet(n)),
        getSheets: () => Object.values(tabs),
        setActiveSheet() {},
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
  ['model.js', 'setup.js', 'api.js', 'menu.js'].forEach((f) =>
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script', f), 'utf8'), context));
  return context;
}

test('setup creates the tabs, and an empty sheet is reported instead of drawn', () => {
  const google = fakeGoogle();
  const app = load(google);
  app.setupSheet();
  assert.deepStrictEqual(Object.keys(google.tabs), ['Cards', 'Fixed', 'Cycle 1', 'Settings']);
  const reply = JSON.parse(app.doGet({ parameter: { date: '2026-11-22' } }));
  assert.strictEqual(reply.ok, false);
});

test('setup refuses to run twice', () => {
  const app = load(fakeGoogle());
  app.setupSheet();
  assert.throws(() => app.setupSheet(), /already exist/);
});

test('new cycle copies the latest cycle tab under the next number', () => {
  const google = fakeGoogle();
  const app = load(google);
  app.setupSheet();
  app.newCycle();
  app.newCycle();
  assert.deepStrictEqual(Object.keys(google.tabs).filter((n) => n.startsWith('Cycle')),
    ['Cycle 1', 'Cycle 2', 'Cycle 3']);
});
