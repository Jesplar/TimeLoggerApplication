# Time Logger Application - Build Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Time Logger - Complete Build Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Get the script directory (root of the project)
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Building Backend..." -ForegroundColor Yellow
Set-Location "$RootDir\Backend\TimeLoggerAPI"
dotnet publish -c Release -r win-x64 --self-contained -o "$RootDir\Electron\backend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Backend built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Building Frontend..." -ForegroundColor Yellow
Set-Location "$RootDir\Frontend"

# Check if node_modules exists, if not run npm install
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Copying frontend to Electron..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$RootDir\Electron\frontend" | Out-Null
Copy-Item -Path "$RootDir\Frontend\dist\*" -Destination "$RootDir\Electron\frontend" -Recurse -Force

Write-Host "Frontend copied successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Preparing database directories..." -ForegroundColor Yellow
# Ensure Data directory exists in Electron for portable mode
New-Item -ItemType Directory -Force -Path "$RootDir\Electron\Data" | Out-Null

Write-Host "Database directories prepared!" -ForegroundColor Green
Write-Host ""

Write-Host "Installing Electron dependencies..." -ForegroundColor Yellow
Set-Location "$RootDir\Electron"

# Check if node_modules exists, if not run npm install
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build completed successfully!        " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To run the application:" -ForegroundColor Cyan
Write-Host "  cd Electron" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "To build installer:" -ForegroundColor Cyan
Write-Host "  cd Electron" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host ""

Set-Location $RootDir
