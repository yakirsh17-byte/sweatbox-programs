@echo off
rem Put this file in the Windows Startup folder (Win+R, shell:startup).
rem Displays must be set to Extend, with screen 2 to the right of screen 1.
timeout /t 15 /nobreak >nul
start "" chrome --kiosk --user-data-dir=C:\boards\s1 --window-position=0,0 "https://yakirsh17-byte.github.io/sweatbox-programs/?screen=1"
start "" chrome --kiosk --user-data-dir=C:\boards\s2 --window-position=1920,0 "https://yakirsh17-byte.github.io/sweatbox-programs/?screen=2"
