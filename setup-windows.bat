@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo =====================================================
echo   THIET LAP DATABASE CHO DU AN BANHANG
echo =====================================================

where psql >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong tim thay psql trong PATH.
  echo Hay them thu muc PostgreSQL\18\bin vao PATH.
  pause
  exit /b 1
)

set /p "DB_PASSWORD=Nhap mat khau tai khoan PostgreSQL postgres: "
if "%DB_PASSWORD%"=="" (
  echo [LOI] Mat khau khong duoc de trong.
  pause
  exit /b 1
)

(
  echo @echo off
  echo set "DB_URL=jdbc:postgresql://localhost:5432/banhang_db"
  echo set "DB_USERNAME=postgres"
  echo set "DB_PASSWORD=%DB_PASSWORD%"
  echo set "JWT_SECRET=banhang-local-secret-please-change-before-production-2026"
  echo set "GOOGLE_CLIENT_ID="
) > config.local.bat

set "PGPASSWORD=%DB_PASSWORD%"
echo.
echo [1/2] Dang kiem tra ket noi PostgreSQL...
psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -tAc "SELECT 1" >nul
if errorlevel 1 (
  echo [LOI] Khong ket noi duoc PostgreSQL. Kiem tra mat khau va dich vu PostgreSQL.
  del config.local.bat >nul 2>&1
  pause
  exit /b 1
)

psql -h localhost -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='banhang_db'" | findstr /x "1" >nul
if errorlevel 1 (
  echo Dang tao database banhang_db...
  psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE banhang_db WITH ENCODING 'UTF8' TEMPLATE template0"
  if errorlevel 1 (
    echo [LOI] Khong the tao database banhang_db.
    del config.local.bat >nul 2>&1
    pause
    exit /b 1
  )
) else (
  echo Database banhang_db da ton tai, giu nguyen du lieu hien co.
)

echo [2/2] Thiet lap hoan tat.
echo Bang va du lieu mau se tu tao khi backend chay lan dau bang Flyway.
echo.
echo Tai khoan admin: admin@banhang.vn
echo Mat khau admin:  Admin@123
echo.
pause
endlocal
