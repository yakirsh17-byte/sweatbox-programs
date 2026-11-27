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
      if (!board.ok || !board.cards) throw new Error((board.errors || ['The Apps Script needs updating']).join(' · '));
      show(board);
      writeCache(board);
      lastSuccess = Date.now();
    } catch (error) {
      console.warn(error);
      delay = 60 * 1000;
      if (!shown) {
        document.getElementById('message').textContent = date ? error.message : 'Program coming soon';
      }
    }
    document.getElementById('stale').hidden = !shown || Date.now() - lastSuccess < STALE_MS;
    setTimeout(refresh, delay);
  }

  const cached = readCache();
  if (cached) show(cached);
  document.fonts.ready.then(fitCards);
  refresh();
})();
