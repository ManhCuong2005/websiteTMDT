@echo off
setlocal
cd /d "%~dp0"

if not exist "face-service\.python\python.exe" (
  echo Chua cai Python cho face service. Hay chay setup-face-service.bat.
  exit /b 1
)

"face-service\.python\python.exe" -m uvicorn app:app --app-dir face-service --host 127.0.0.1 --port 8001
