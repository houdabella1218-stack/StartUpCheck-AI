@echo off
REM ===================================================================
REM  StartUpCheck AI - lancement pour la presentation
REM  Double-cliquez sur ce fichier pour demarrer l'application.
REM ===================================================================
setlocal
cd /d "%~dp0"

echo.
echo  ===============================================
echo   StartUpCheck AI - demarrage
echo  ===============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [ERREUR] Node.js n'est pas installe.
  echo  Installez Node.js LTS depuis https://nodejs.org puis relancez.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Installation des dependances racine...
  call npm install --no-audit --no-fund || goto :error
)

if not exist "server\node_modules" (
  echo  Installation des dependances du serveur...
  call npm install --prefix server --no-audit --no-fund || goto :error
)

if not exist "client\node_modules" (
  echo  Installation des dependances du client...
  call npm install --prefix client --no-audit --no-fund || goto :error
)

if not exist "server\prisma\dev.db" (
  echo  Creation de la base de donnees locale...
  call npm --prefix server run db:push || goto :error
)

echo.
echo  Lancement du serveur API et de l'interface...
echo  Interface : http://localhost:5173
echo  API       : http://localhost:4000/api/health
echo.
echo  Pour arreter : Ctrl + C dans cette fenetre.
echo.

call npm run dev
goto :eof

:error
echo.
echo  [ERREUR] Une etape a echoue. Lisez le message ci-dessus.
echo.
pause
exit /b 1
