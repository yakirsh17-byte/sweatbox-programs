# SweatBox programs

Studio screens fed by a private Google Sheet.

- Screen 1: `?screen=1`  ·  Screen 2: `?screen=2`
- Preview another week: add `&date=2026-11-29`

## 1. Sheet and script (once)
1. Create a Google Sheet. Open **Extensions > Apps Script**.
2. In **Project settings**, set the time zone to Jerusalem.
3. Add one script file for each file in `apps-script/` and paste its contents.
4. Run `setupSheet` and approve the permissions.
5. **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**.
6. Put the `/exec` URL in `web/config.js`.

After changing the script: **Deploy > Manage deployments > edit > New version**, so the URL stays the same.

## 2. Entering programs
- One tab per cycle (`Cycle 1`, `Cycle 2`, ...). Each row has a week (1-4) and a card.
- Next cycle: **SweatBox > New cycle**, then edit the copy.
- **SweatBox > Check and preview** lists problems for a date and gives preview links.
- Weeks are counted continuously from `cycle_1_starts` in `Settings`.

## 3. Studio PC (Windows, two 1920x1080 screens)
1. Set Windows displays to **Extend**, and turn off sleep.
2. Run `kiosk/start-boards.bat`. Close a window with Alt+F4.
3. To start with Windows, put a shortcut to it in the `shell:startup` folder.

## 4. Hosting
Pushing to `main` deploys `web/` to GitHub Pages (**Settings > Pages > Source: GitHub Actions**).
Custom domain: set `programs.sweatboxstudio.co.il` in **Settings > Pages**, add
`CNAME programs -> yakirsh17-byte.github.io` at your DNS provider, then **Enforce HTTPS**.
Then update the two addresses in the kiosk file.

## Tests
`node --test tests/*.test.js`

Do not commit program content or member details: this repository is public.
