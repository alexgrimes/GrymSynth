@echo off
setlocal

:: Set environment variables
set NODE_ENV=test
set DEBUG=true

:: Install dependencies if needed
call npm install

:: Run tests with specified arguments
call npm test -- %* --verbose

:: Preserve exit code
set EXIT_CODE=%ERRORLEVEL%

:: Show test completion message
if %EXIT_CODE% EQU 0 (
    echo.
    echo Tests completed successfully!
) else (
    echo.
    echo Tests failed with exit code %EXIT_CODE%
)

exit /b %EXIT_CODE%
