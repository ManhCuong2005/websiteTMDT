@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist config.local.bat (
  echo Chua thiet lap database. Hay chay setup-windows.bat truoc.
  pause
  exit /b 1
)

start "BANHANG Backend" cmd /k "chcp 65001 >nul && cd /d ""%~dp0"" && run-backend.bat"
timeout /t 4 /nobreak >nul
start "BANHANG Frontend" cmd /k "chcp 65001 >nul && cd /d ""%~dp0"" && run-frontend.bat"

echo Da mo 2 cua so chay backend va frontend.
echo Truy cap: http://localhost:5173
