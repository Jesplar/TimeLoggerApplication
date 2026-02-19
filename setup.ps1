# Time Logger Application - Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Time Logger - Initial Setup Script   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Get the script directory (root of the project)
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check for Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is NOT installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check for .NET
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK is installed: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ .NET SDK is NOT installed!" -ForegroundColor Red
    Write-Host "  Please install .NET SDK from: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install Frontend dependencies
Write-Host "Installing Frontend dependencies..." -ForegroundColor Cyan
Set-Location "$RootDir\Frontend"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install frontend dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install Electron dependencies
Write-Host "Installing Electron dependencies..." -ForegroundColor Cyan
Set-Location "$RootDir\Electron"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install Electron dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Electron dependencies installed" -ForegroundColor Green
Write-Host ""

Set-Location $RootDir

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completed successfully!        " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the build script:" -ForegroundColor White
Write-Host "   .\build.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Start the application:" -ForegroundColor White
Write-Host "   cd Electron" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
