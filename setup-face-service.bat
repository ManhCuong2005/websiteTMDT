@echo off
setlocal
cd /d "%~dp0"

if not exist "face-service\.python\python.exe" (
  echo Chua co Python cuc bo tai face-service\.python.
  echo Hay cai Python 3.11 vao thu muc nay truoc.
  exit /b 1
)

echo Dang cai thu vien nhan dien guong mat...
"face-service\.python\python.exe" -m pip install -r "face-service\requirements.txt"
if errorlevel 1 exit /b 1

if not exist "face-service\models\det_500m.onnx" (
  echo.
  echo Chua co model InsightFace buffalo_s trong face-service\models.
  echo Tai buffalo_s.zip tu InsightFace va giai nen cac file .onnx vao thu muc tren.
  exit /b 1
)

echo.
echo Face service da san sang.
