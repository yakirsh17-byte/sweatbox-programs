/* Fetches the board, keeps the last good copy, and refreshes on a timer. */
(() => {
  const params = new URLSearchParams(location.search);
  const screen = params.get('screen') === '2' ? 2 : 1;
  const date = params.get('date');
  const CACHE_KEY = 'sweatbox-board';
  let shown = '';
  let lastSuccess = Date.now();

  function show(board) {
    const next = JSON.stringify(board);
    if (next === shown) return;
    renderBoard(board, screen);
    shown = next;
  }

  /* A preview must never overwrite, or fall back to, the live board. */
  function readCache() {
    if (date) return null;
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
  }
  function writeCache(board) {
    if (date) return;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(board)); } catch { /* storage unavailable */ }
  }

  async function refresh() {
    let delay = REFRESH_MS;
    try {
      const url = new URL(API_URL);
      if (date) url.searchParams.set('date', date);
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const board = await response.json();
      const outdated = board.version !== EXPECTED_SCRIPT_VERSION;
      const notice = document.getElementById('notice');
      notice.textContent = outdated ? `Apps Script v${board.version ?? '?'} · expected v${EXPECTED_SCRIPT_VERSION}` : '';
      notice.hidden = !outdated;
      if (!board.ok || !board.cards) {
        throw new Error(outdated ? 'Apps Script is out of date: deploy a new version' : board.errors.join(' · '));
      }
      show(board);
      writeCache(board);
      lastSuccess = Date.now();
    } catch (error) {
      console.warn(error);
      delay = 60 * 1000;
      if (!shown) {
        const technical = date || error.message.startsWith('Apps Script');
        document.getElementById('message').textContent = technical ? error.message : 'Program coming soon';
      }
    }
    document.getElementById('stale').hidden = !shown || Date.now() - lastSuccess < STALE_MS;
    setTimeout(refresh, delay);
  }

  /* Reload once a night so the screens pick up new code, but only when the site
     is reachable: reloading while offline would leave Chrome's error page up. */
  async function tryReload() {
    try {
      const response = await fetch(location.href, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
      if (response.ok) {
        location.reload();
        return;
      }
    } catch { /* offline: try again later */ }
    setTimeout(tryReload, 10 * 60 * 1000);
  }
  function scheduleReload() {
    const next = new Date();
    next.setHours(RELOAD_HOUR, 0, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    setTimeout(tryReload, next - new Date());
  }

  const cached = readCache();
  if (cached) show(cached);
  document.fonts.ready.then(fitCards);
  refresh();
  scheduleReload();
})();
