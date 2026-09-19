@echo off
REM =====================================================================
REM  Rakshak AI - Browser Extension Installer (Windows)
REM  Loads the extension into a Chrome/Edge developer session and opens
REM  the extensions page for the final one-click "Load unpacked" step.
REM =====================================================================
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo  ============================================================
echo    RAKSHAK AI - Browser Extension Installer
echo  ============================================================
echo.

REM ---- 1. Validate required files ------------------------------------
if not exist "%ROOT%manifest.json" (
  echo  [ERROR] manifest.json not found. Run this from the browser-extension folder.
  pause
  exit /b 1
)
if not exist "%ROOT%background.js"        goto :missing
if not exist "%ROOT%content.js"           goto :missing
if not exist "%ROOT%popup.html"           goto :missing
if not exist "%ROOT%engine\nlp.js"        goto :missing
if not exist "%ROOT%engine\urlDetector.js" goto :missing
if not exist "%ROOT%engine\upi.js"        goto :missing
if not exist "%ROOT%engine\bloom.js"      goto :missing
if not exist "%ROOT%engine\data.js"       goto :missing
if not exist "%ROOT%icons\icon16.png"     goto :missing
if not exist "%ROOT%icons\icon48.png"     goto :missing
if not exist "%ROOT%icons\icon128.png"    goto :missing
echo  [OK] Extension files present.
echo.

REM ---- 2. Pick browser ------------------------------------------------
set "CHROME="
set "EDGE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe"     set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if not defined CHROME if not defined EDGE (
  echo  [ERROR] Could not find Chrome or Edge. Install one and re-run.
  pause
  exit /b 1
)

set "BROWSER="
set "BNAME="
if defined CHROME (
  echo    [1] Google Chrome
)
if defined EDGE (
  echo    [2] Microsoft Edge
)
set /p "CHOICE=Choose browser (1 or 2, default 1): "
if "%CHOICE%"=="2" (
  if defined EDGE ( set "BROWSER=%EDGE%" & set "BNAME=Microsoft Edge" ) else ( set "BROWSER=%CHROME%" & set "BNAME=Google Chrome" )
) else (
  if defined CHROME ( set "BROWSER=%CHROME%" & set "BNAME=Google Chrome" ) else ( set "BROWSER=%EDGE%" & set "BNAME=Microsoft Edge" )
)
echo  [OK] Using %BNAME%
echo.

REM ---- 3. Launch a temporary dev container with the extension loaded ---
echo  Launching %BNAME% in developer mode with Rakshak AI pre-loaded...
echo  A temporary incognito-style window will open - the extension is active there.
echo.
start "" "%BROWSER%" --new-window --load-extension="%ROOT%" --disable-extensions-except="%ROOT%" "chrome://extensions" "https://web.whatsapp.com"
if not defined BROWSER exit /b 0

echo.
echo  ============================================================
echo    DONE - one manual step for PERMANENT install:
echo  ============================================================
echo.
echo    1. The dev window opened with Rakshak AI already running.
echo    2. To install it permanently into your normal browser:
echo       - Open  %BNAME%  >  %BNAME%://extensions
echo       - Turn ON "Developer mode"  (top-right)
echo       - Click "Load unpacked"
echo       - Select this folder:
echo             %ROOT%
echo       - Pin the Rakshak AI shield icon to the toolbar.
echo.
echo    Report scams anytime at the National Cyber Helpline: 1930
echo.
pause
exit /b 0

:missing
echo  [ERROR] Missing extension file. Make sure you run this from the
echo          browser-extension folder and all files are present.
pause
exit /b 1
