/** Pure rules: which week to show, and how sheet rows become a board. No Google services here. */
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ROWS = 9;

const toUtc = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

/** Continuous count of weeks since the Sunday on which Cycle 1 began. */
function weekPosition(startIso, dateIso) {
  const days = Math.round((toUtc(dateIso) - toUtc(startIso)) / DAY_MS);
  if (!(days >= 0)) return null;
  const weeks = Math.floor(days / 7);
  const startsOn = new Date(toUtc(startIso) + weeks * 7 * DAY_MS).toISOString().slice(0, 10);
  return { cycleDue: Math.floor(weeks / 4) + 1, week: (weeks % 4) + 1, startsOn };
}

/** Turns [header, ...lines] into objects, remembering the sheet row number. */
function toRecords(values) {
  const [header = [], ...lines] = values;
  return lines.map((line, index) => {
    const record = { line: index + 2 };
    header.forEach((key, i) => { record[key.trim()] = String(line[i] ?? '').trim(); });
    return record;
  });
}

const hasContent = (row) => Boolean(row.exercise || row.highlight || row.sets || row.reps);

/** Highest "Cycle N" with content, N not later than the cycle that is due. */
function pickCycle(tabs, cycleDue) {
  const ready = Object.keys(tabs)
    .map((name) => /^Cycle (\d+)$/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .filter((n) => n <= cycleDue && toRecords(tabs['Cycle ' + n]).some(hasContent));
  return ready.length ? Math.max(...ready) : null;
}

/** Groups rows into sections, and neighbouring rows with the same superset letter into one group. */
function buildSections(rows, autoRed, where, errors) {
  const sections = [];
  let previous = null;
  rows.forEach((row) => {
    const at = `${where} row ${row.line}`;
    const red = row.red.toLowerCase();
    if (!['', 'sets', 'reps', 'both', 'none'].includes(red)) errors.push(`${at}: unknown red value "${row.red}"`);
    if (!row.exercise && (row.sets || row.reps)) errors.push(`${at}: sets or reps without an exercise`);

    let section = sections[sections.length - 1];
    if (!section || section.title !== row.section) {
      section = { title: row.section, groups: [] };
      sections.push(section);
      previous = null;
    }
    const isRed = (column, automatic) => (red === '' ? automatic : red === column || red === 'both');
    const item = {
      exercise: row.exercise,
      highlight: row.highlight,
      reps: row.reps,
      redReps: isRed('reps', /max/i.test(row.reps)),
    };
    if (row.superset && previous && previous.letter === row.superset) {
      const group = section.groups[section.groups.length - 1];
      if (row.sets && row.sets !== group.sets) errors.push(`${at}: superset ${row.superset} has different sets`);
      group.rows.push(item);
    } else {
      section.groups.push({
        letter: row.superset,
        sets: row.sets,
        redSets: isRed('sets', autoRed && row.sets !== '' && row.sets !== '3'),
        rows: [item],
      });
    }
    previous = { letter: row.superset };
  });
  return sections;
}

/** tabs: { tabName: displayValues }. Returns the board for the given date, or the errors. */
function buildBoard(tabs, dateIso) {
  const fail = (...errors) => ({ ok: false, errors, warnings: [] });
  const missing = ['Cards', 'Fixed', 'Settings'].filter((name) => !tabs[name]);
  if (missing.length) return fail('Missing tabs: ' + missing.join(', '));

  const settings = {};
  toRecords(tabs.Settings).forEach((r) => { settings[r.key] = r.value; });
  const start = settings.cycle_1_starts || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return fail('Settings: cycle_1_starts must look like 2026-11-01');
  const position = weekPosition(start, dateIso);
  if (!position) return fail(`No programs before ${start}`);
  const cycle = pickCycle(tabs, position.cycleDue);
  if (!cycle) return fail('No cycle tab with content');

  const errors = [];
  const warnings = [];
  const cards = toRecords(tabs.Cards).filter((c) => c.card_id);
  const isFixed = (card) => card.fixed === 'yes';
  const tabName = 'Cycle ' + cycle;
  const weekly = toRecords(tabs[tabName]).filter(hasContent);
  const fixed = toRecords(tabs.Fixed).filter(hasContent);

  weekly.forEach((row) => {
    if (!['1', '2', '3', '4'].includes(row.week)) errors.push(`${tabName} row ${row.line}: week must be 1-4`);
    if (!cards.some((c) => c.card_id === row.card && !isFixed(c))) {
      errors.push(`${tabName} row ${row.line}: unknown card "${row.card}"`);
    }
  });
  fixed.forEach((row) => {
    if (!cards.some((c) => c.card_id === row.card && isFixed(c))) {
      errors.push(`Fixed row ${row.line}: unknown card "${row.card}"`);
    }
  });

  const thisWeek = weekly.filter((row) => row.week === String(position.week));
  if (!thisWeek.length) errors.push(`${tabName} has no rows for week ${position.week}`);

  const result = cards.map((card) => {
    const where = isFixed(card) ? 'Fixed' : tabName;
    const rows = (isFixed(card) ? fixed : thisWeek).filter((row) => row.card === card.card_id);
    if (!rows.length) warnings.push(`${card.card_id} has no rows`);
    if (!isFixed(card) && rows.length > MAX_ROWS) warnings.push(`${card.card_id} has ${rows.length} rows; text will shrink`);
    return {
      id: card.card_id,
      title: card.title,
      color: card.color,
      screen: Number(card.screen),
      order: Number(card.order),
      tall: card.tall === 'yes',
      sections: buildSections(rows, card.auto_red === 'yes', where, errors),
    };
  });

  if (errors.length) return { ok: false, errors, warnings };
  return {
    ok: true,
    warnings,
    brand: settings.brand || '',
    labels: { 1: settings.screen_1_label || '', 2: settings.screen_2_label || '' },
    cycle,
    week: position.week,
    startsOn: position.startsOn,
    cards: result.sort((a, b) => a.screen - b.screen || a.order - b.order),
  };
}

if (typeof module !== 'undefined') module.exports = { weekPosition, buildBoard };
