# SweatBox programs

Two studio TV screens showing the week's workout programs for SweatBox, a gym in Israel. The owner enters programs in a private Google Sheet; an Apps Script web app turns them into JSON; a static page on GitHub Pages draws the boards. Full design: `docs/design.md`.

## How it fits together
- `apps-script/` runs inside Google, not here. The owner copies each file by hand into the Apps Script editor (`Code.gs` = `setup.js`, plus `api`, `model`, `menu`) and publishes **Deploy > Manage deployments > edit > New version** so the `/exec` URL never changes.
- `web/` is deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`, after the tests pass.
- Screens: `?screen=1` and `?screen=2`. Preview a date: `&date=YYYY-MM-DD`.
- `model.js` holds all rules and has no Google calls, so it runs in Node for tests. The page only draws what the API returns.

## Commands
- Tests: `node --test tests/*.test.js` (no dependencies to install)
- Local view: serve `web/` (for example `npx serve web`) and open `/?screen=1`

## Rules for changes
- **The repository is public.** Never commit workout content, the seed file (`seed-*.js`), sheet exports, member details or screenshots of real programs. Use invented exercise names in tests and docs.
- When any `apps-script/` file changes, raise `SCRIPT_VERSION` in `apps-script/api.js` **and** `EXPECTED_SCRIPT_VERSION` in `web/config.js` (a test checks they match), and tell the owner which files to paste and to publish a New version.
- Keep the API contract stable: the live screens may run older page code until their nightly 04:00 reload.
- Insert sheet text with `textContent` only, never as HTML.
- Never stop the screens: invalid data keeps the last good board; only rows for the week on screen may block an update, everything else is a warning.
- Hebrew is right-to-left; keep `dir="auto"` / `<bdi>` around mixed text such as reps.
- Ask the owner before pushing to `main`, since pushing deploys straight to the studio screens. Explain things in plain, non-technical language.

## Sheet model (summary)
- Tabs: `Cards` (card_id, title, color, screen, order, tall, auto_red, fixed), `Fixed`, `Cycle 1`, `Cycle 2`, … (week, card, section, exercise, sets, reps, superset, highlight, red), `Settings` (brand, screen labels, `cycle_1_starts` = 2026-11-01).
- Weeks are counted continuously from `cycle_1_starts`: week = weeks mod 4 + 1, cycle due = weeks div 4 + 1. The highest existing `Cycle N` ≤ cycle due with content is used, so the previous cycle repeats if the next tab is missing.
- Red: sets ≠ 3 (when `auto_red`), reps containing MAX; the `red` column (`sets`/`reps`/`both`/`none`) overrides. Same superset letter on neighbouring rows = one group sharing sets.

## Status, 27 November 2026
- Live on GitHub Pages: https://yakirsh17-byte.github.io/sweatbox-programs/
- Apps Script: connection proven. The owner must deploy script version 2 (api, model, menu changed); until then the screens show "Apps Script is out of date".
- Script version 3 (all four files changed: issues 5, 6, 7, 8 and 9) is ready in the code but not yet pasted by the owner; after pasting, the owner runs `updateCardLists` once to approve the narrower access. Push it to `main` only after the owner has published it, or the screens show a version note.
- Deadline: Sunday 29/11/2026 is Cycle 2 week 1; the owner must create `Cycle 2` (SweatBox > New cycle) and enter week 1.
- Not done: custom domain `programs.sweatboxstudio.co.il` (CNAME to `yakirsh17-byte.github.io`), testing `kiosk/start-boards.bat` on the Windows studio PC, proofreading the seeded week 4.

## Open issues from the 27/11 review
Fixed in script version 3: 5 (reps that look like a date are a warning), 6 (`cycle_1_starts` must be a real Sunday), 7 (`@OnlyCurrentDoc` in `api.js`), 8 (card ids match whatever their capital letters; the card dropdowns on every cycle tab are rebuilt from `Cards` on edit, on New cycle and from SweatBox > Update card lists), 9 (empty sets on a superset's first row has its own message).
10. `.gitignore` added for seed and export files; still review every commit for program content.
