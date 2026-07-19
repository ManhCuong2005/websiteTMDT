@echo off
setlocal EnableExtensions
title BANHANG - Environment Check

echo ==================================================
echo BANHANG PROJECT - ENVIRONMENT CHECK
echo ==================================================
echo.

call :check "Java Runtime" "java -version"
call :check "Java Compiler" "javac -version"
call :check "Node.js" "node -v"
call :check "npm" "npm -v"
call :check "Git" "git --version"
call :check "PostgreSQL CLI" "psql --version"
call :check "PostgreSQL Server" "pg_isready -h localhost -p 5432"

where code >nul 2>&1
if errorlevel 1 (
    echo [WARNING] VS Code CLI command "code" was not found.
    echo VS Code can still be opened manually.
) else (
    echo [OK] VS Code CLI
    code --version | findstr /n "." | findstr "^1:"
)

echo.
echo ==================================================
echo CHECK COMPLETED
echo ==================================================
echo If Java, Node.js, npm, Git, PostgreSQL CLI and
echo PostgreSQL Server show [OK], run setup-windows.bat.
echo.
pause
exit /b 0

:check
set "LABEL=%~1"
set "COMMAND=%~2"

cmd /d /c "%COMMAND%" > "%TEMP%\banhang-check.txt" 2>&1

if errorlevel 1 (
    echo [ERROR] %LABEL%
    type "%TEMP%\banhang-check.txt"
) else (
    echo [OK] %LABEL%
    type "%TEMP%\banhang-check.txt"
)

del "%TEMP%\banhang-check.txt" >nul 2>&1
echo.
exit /b 0