@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"

if not exist node_modules (
  echo [BANHANG] Dang cai thu vien frontend lan dau...
  call npm install
  if errorlevel 1 (
    echo Khong cai duoc thu vien. Kiem tra Internet va Node.js.
    pause
    exit /b 1
  )
)

call npm run dev
