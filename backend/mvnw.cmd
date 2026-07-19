@echo off
setlocal
set "MAVEN_VERSION=3.9.11"
set "MAVEN_HOME=%USERPROFILE%\.m2\banhang-wrapper\apache-maven-%MAVEN_VERSION%"
set "MAVEN_ZIP=%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip"
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo [BANHANG] Dang tai Maven %MAVEN_VERSION% lan dau...
  if not exist "%USERPROFILE%\.m2\banhang-wrapper" mkdir "%USERPROFILE%\.m2\banhang-wrapper"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%MAVEN_ZIP%'"
  if errorlevel 1 (
    echo Khong tai duoc Maven. Kiem tra Internet hoac cai Maven thu cong.
    exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force '%MAVEN_ZIP%' '%USERPROFILE%\.m2\banhang-wrapper'"
  del "%MAVEN_ZIP%" >nul 2>&1
)
call "%MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
