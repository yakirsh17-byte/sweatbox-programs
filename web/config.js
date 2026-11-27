// Paste the Apps Script web app URL (ends in /exec) between the quotes.
const API_URL = 'https://script.google.com/macros/s/AKfycbyfqQi1FlJZjgxLxwZOCtLG05uWXXRNMO4-Hru7mrEeH0E2Ffm2UOKqnyOJmhd0NDMewQ/exec';
// Must match SCRIPT_VERSION in apps-script/api.js.
const EXPECTED_SCRIPT_VERSION = 3;
// Hour (0-23, the PC's clock) at which the screens reload to pick up new code.
const RELOAD_HOUR = 4;
const REFRESH_MS = 5 * 60 * 1000;
const STALE_MS = 30 * 60 * 1000;
