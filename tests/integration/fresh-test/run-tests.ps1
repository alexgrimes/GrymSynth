# PowerShell script to run tests with detailed output

Write-Host "`nTest Environment Details:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Check Node and npm versions
Write-Host "`nNode version:" -ForegroundColor Yellow
node --version
Write-Host "`nnpm version:" -ForegroundColor Yellow
npm --version

# List directory contents
Write-Host "`nDirectory contents:" -ForegroundColor Yellow
Get-ChildItem -Force

# Display package.json content
Write-Host "`npackage.json content:" -ForegroundColor Yellow
if (Test-Path package.json) {
    Get-Content package.json | Write-Host
} else {
    Write-Host "package.json not found!" -ForegroundColor Red
}

# Ensure Jest is installed
Write-Host "`nChecking Jest installation..." -ForegroundColor Yellow
if (-not (Test-Path node_modules/jest)) {
    Write-Host "Installing Jest..." -ForegroundColor Yellow
    npm install jest --save
}

# Run the tests with verbose output
Write-Host "`nRunning tests..." -ForegroundColor Green
Write-Host "==============" -ForegroundColor Green

try {
    npx jest comprehensive.test.js --verbose --detectOpenHandles --logHeapUsage 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nTests completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nTests failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "`nError running tests: $_" -ForegroundColor Red
    exit 1
}

# Display current process info
Write-Host "`nProcess Information:" -ForegroundColor Yellow
Get-Process node | Where-Object { $_.MainWindowTitle -eq "" } | Format-Table Id, ProcessName, CPU, WorkingSet
