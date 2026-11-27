const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Minimal in-memory stand-in for the Google services the scripts use.
function fakeGoogle() {
  const tabs = {};
  const sheet = (name, cells = [], dropdowns = {}) => {
    const range = (row, col) => {
      const r = {
        setValues(values) {
          values.forEach((line, i) => {
            assert.strictEqual(line.length, values[0].length);
            cells[row - 1 + i] = line;
          });
          return r;
        },
        setNumberFormat: () => r, setFontWeight: () => r,
        setDataValidation(rule) { dropdowns[col] = rule.values; return r; },
        getSheet: () => tabs[name],
      };
      return r;
    };
    return {
      cells,
      dropdowns,
      getName: () => name,
      copyTo: () => {
        const copy = sheet(name + ' copy', cells.map((line) => [...line]), { ...dropdowns });
        copy.setName = (to) => { tabs[to] = sheet(to, copy.cells, copy.dropdowns); return tabs[to]; };
        return copy;
      },
      getRange: (a, b) => (typeof a === 'string' ? range(1, 1) : range(a, b)),
      setFrozenRows() {},
      getDataRange: () => ({ getDisplayValues: () => cells.map((line) => line.map(String)) }),
      getMaxRows: () => 1000, getLastRow: () => cells.length,
    };
  };
  const rule = {
    requireValueInList: (values) => { rule.values = values; return rule; },
    setAllowInvalid: () => rule,
    build: () => ({ values: rule.values }),
  };
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
  assert.strictEqual(reply.version, vm.runInContext('SCRIPT_VERSION', app));
});

test('the page expects the version the script reports', () => {
  const config = fs.readFileSync(path.join(__dirname, '../web/config.js'), 'utf8');
  const expected = Number(/EXPECTED_SCRIPT_VERSION = (\d+)/.exec(config)[1]);
  assert.strictEqual(expected, vm.runInContext('SCRIPT_VERSION', load(fakeGoogle())));
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

test('card dropdowns follow the Cards tab, on every cycle tab', () => {
  const google = fakeGoogle();
  const app = load(google);
  app.setupSheet();
  assert.deepStrictEqual([...google.tabs['Cycle 1'].dropdowns[1]], ['1', '2', '3', '4']);
  assert.ok(!google.tabs['Cycle 1'].dropdowns[2].includes('PROTOCOL'));
  app.newCycle();
  google.tabs.Cards.cells.push(['NEWCARD', 'New', '#fff', '2', '7', 'no', 'yes', 'no']);
  app.onEdit({ range: google.tabs.Cards.getRange(2, 1) });
  ['Cycle 1', 'Cycle 2'].forEach((tab) => assert.ok(google.tabs[tab].dropdowns[2].includes('NEWCARD'), tab));
  google.tabs.Cards.cells.push(['LATER', 'Later', '#fff', '2', '8', 'no', 'yes', 'no']);
  app.onEdit({ range: google.tabs['Cycle 1'].getRange(2, 1) });
  assert.ok(!google.tabs['Cycle 1'].dropdowns[2].includes('LATER'));
});

test('the script asks for access to this sheet only', () => {
  const api = fs.readFileSync(path.join(__dirname, '../apps-script/api.js'), 'utf8');
  assert.match(api, /^\/\*\* @OnlyCurrentDoc \*\//);
});
