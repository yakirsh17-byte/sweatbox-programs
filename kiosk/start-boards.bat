@echo off
rem Opens both studio screens in full-screen Chrome windows.
rem Put a shortcut to this file in the Windows Startup folder (Win+R, shell:startup).
rem Displays: Extend, screen 2 to the right of screen 1, Scale 100%.
rem If screen 2 opens on top of screen 1, change 1920 below to the width of screen 1.
set PAGE=https://yakirsh17-byte.github.io/sweatbox-programs/
set FLAGS=--kiosk --no-first-run --no-default-browser-check --noerrdialogs --hide-crash-restore-bubble --disable-features=Translate --disable-pinch
timeout /t 15 /nobreak >nul
start "" chrome %FLAGS% --user-data-dir=C:\boards\s1 --window-position=0,0 "%PAGE%?screen=1"
start "" chrome %FLAGS% --user-data-dir=C:\boards\s2 --window-position=1920,0 "%PAGE%?screen=2"
