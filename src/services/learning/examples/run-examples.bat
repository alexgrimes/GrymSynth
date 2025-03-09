@echo off
setlocal EnableDelayedExpansion

echo Pattern Learning System Examples
echo.

REM Create required directories
echo Setting up directories...
if not exist "data\vector-index" mkdir "data\vector-index"
if not exist "data\patterns" mkdir "data\patterns"
if not exist "data\feedback" mkdir "data\feedback"

REM Function to display result
:displayResult
if %ERRORLEVEL% EQU 0 (
    echo [92m✓ Success[0m
) else (
    echo [91m✗ Failed[0m
    exit /b 1
)
goto :eof

REM Verify setup first
echo.
echo Step 1: Verifying system setup...
call npx ts-node src/services/learning/examples/verify-setup.ts
call :displayResult
if %ERRORLEVEL% NEQ 0 (
    echo [91mSetup verification failed. Please fix the issues before running examples.[0m
    exit /b 1
)

REM Run the main example
echo.
echo Step 2: Running pattern learning demo...
call npx ts-node src/services/learning/examples/pattern-learning-demo.ts
call :displayResult
if %ERRORLEVEL% NEQ 0 (
    echo [91mPattern learning demo failed.[0m
    exit /b 1
)

echo.
echo [92mAll examples completed successfully![0m
echo.
echo To learn more about the pattern learning system, check out:
echo - src/services/learning/README.md
echo - src/services/learning/examples/README.md

:end
endlocal
