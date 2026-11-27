/* Draws a board. Sheet text is only ever inserted as text, never as HTML. */
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter((child) => child !== null && child !== ''));
  return node;
}

function exerciseText(row, tagged) {
  return [
    tagged ? el('b', { className: 'tag' }, 'סופר סט') : null,
    tagged ? ' ' : null,
    el('bdi', {}, row.exercise),
    row.highlight ? ' ' : null,
    row.highlight ? el('b', { className: 'red' }, row.highlight) : null,
  ];
}

function groupRows(group) {
  const superset = group.rows.length > 1;
  return group.rows.map((row, index) => {
    const tr = el('tr', { className: superset ? 'superset' : '' },
      el('td', { className: 'exercise' }, ...exerciseText(row, superset && index === 0)));
    if (index === 0) {
      const style = superset ? 'sets superset' : group.redSets ? 'sets red' : 'sets';
      tr.append(el('td', { className: style, rowSpan: group.rows.length }, group.sets));
    }
    tr.append(el('td', { className: row.redReps ? 'reps red' : 'reps' }, el('span', { dir: 'auto' }, row.reps)));
    return tr;
  });
}

/* Rows with neither sets nor reps are shown as full-width text lines. */
const isNote = (group) => !group.sets && group.rows.every((row) => !row.reps);

function sectionNodes(section) {
  const nodes = section.title ? [el('h3', {}, section.title)] : [];
  let table = null;
  section.groups.forEach((group) => {
    if (isNote(group)) {
      table = null;
      group.rows.forEach((row) => nodes.push(el('p', { className: 'note' }, ...exerciseText(row, false))));
      return;
    }
    if (!table) {
      table = el('tbody');
      nodes.push(
        el('div', { className: 'cols' }, el('span', {}, 'תרגיל'), el('span', {}, 'סטים'), el('span', {}, 'חזרות')),
        el('table', {}, el('colgroup', {}, el('col'), el('col', { className: 'sets-col' }), el('col', { className: 'reps-col' })), table),
      );
    }
    table.append(...groupRows(group));
  });
  return nodes;
}

function cardNode(card) {
  const node = el('section', { className: card.tall ? 'card tall' : 'card' },
    el('h2', {}, el('span', {}, card.title)),
    el('div', { className: 'body' }, el('div', {}, ...card.sections.flatMap(sectionNodes))));
  node.style.setProperty('--c', card.color);
  return node;
}

/* Shrink any card whose content is taller than its space. */
function fitCards() {
  document.querySelectorAll('.card .body').forEach((body) => {
    const content = body.firstElementChild;
    let zoom = 1;
    content.style.zoom = zoom;
    while (content.getBoundingClientRect().height > body.getBoundingClientRect().height + 1 && zoom > 0.5) {
      zoom -= 0.02;
      content.style.zoom = zoom;
    }
  });
}

function fitStage() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.getElementById('stage').style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function renderBoard(board, screen) {
  document.getElementById('brand').textContent = board.brand;
  document.getElementById('label').textContent = board.labels[screen] || '';
  document.getElementById('week').textContent = 'WEEK ' + board.week;
  document.getElementById('dots').replaceChildren(
    ...[1, 2, 3, 4].map((n) => el('i', { className: n === board.week ? 'on' : '' })));
  document.getElementById('board').replaceChildren(
    ...board.cards.filter((card) => card.screen === screen).map(cardNode));
  document.getElementById('message').hidden = true;
  fitCards();
}

window.addEventListener('resize', fitStage);
fitStage();
