@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist config.local.bat (
  echo Chua co cau hinh local. Hay chay setup-windows.bat truoc.
  pause
  exit /b 1
)

call config.local.bat
cd backend
set "JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8 %JAVA_TOOL_OPTIONS%"
call mvnw.cmd spring-boot:run
