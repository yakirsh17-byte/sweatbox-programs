# SweatBox programs

Studio screens fed by a private Google Sheet. Current stage: sheet setup and connection test.

## 1. Sheet and API
1. Create a new Google Sheet. Open **Extensions > Apps Script**.
2. In **Project settings**, set the time zone to Jerusalem.
3. Add two script files and paste in `apps-script/setup.js` and `apps-script/api.js`.
4. Choose `setupSheet`, press **Run**, and approve the permissions.
5. Optional: add your private seed file, then run `seedPrograms` once.
6. **Deploy > New deployment > Web app**. Execute as **Me**, access **Anyone**. Copy the `/exec` URL.

## 2. Page
1. Put the URL in `web/config.js`.
2. In the repository, **Settings > Pages > Source: GitHub Actions**.
3. Push to `main` (or run the workflow from the **Actions** tab).
4. Open the Pages address. It should show `CONNECTED`.

## 3. Domain (after the test passes)
1. In **Settings > Pages**, set the custom domain to `programs.sweatboxstudio.co.il`.
2. At your DNS provider add `CNAME programs -> yakirsh17-byte.github.io`.
3. Enable **Enforce HTTPS** when it becomes available.

Do not commit program content or member details: this repository is public.
