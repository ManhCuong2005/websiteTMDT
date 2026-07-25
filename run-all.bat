@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist config.local.bat (
  echo Chua thiet lap database. Hay chay setup-windows.bat truoc.
  pause
  exit /b 1
)

if not exist "face-service\models\det_500m.onnx" (
  echo Chua co model nhan dien guong mat. Hay chay setup-face-service.bat.
  pause
  exit /b 1
)

start "BANHANG Face Service" cmd /k "chcp 65001 >nul && cd /d ""%~dp0"" && run-face-service.bat"
timeout /t 2 /nobreak >nul
start "BANHANG Backend" cmd /k "chcp 65001 >nul && cd /d ""%~dp0"" && run-backend.bat"
timeout /t 4 /nobreak >nul
start "BANHANG Frontend" cmd /k "chcp 65001 >nul && cd /d ""%~dp0"" && run-frontend.bat"

echo Da mo 3 cua so chay face service, backend va frontend.
echo Truy cap: http://localhost:5173
