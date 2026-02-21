# Time Logger - Production Packaging Script
# Creates installer and portable package

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Time Logger - Production Packaging  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the application
Write-Host "Step 1: Building application..." -ForegroundColor Yellow
& "$PSScriptRoot\build.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Aborting packaging." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating installer and portable package..." -ForegroundColor Yellow

# Navigate to Electron directory
Set-Location "$PSScriptRoot\Electron"

# Run electron-builder to create packages
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Packaging failed!" -ForegroundColor Red
    Set-Location $PSScriptRoot
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating portable ZIP archive..." -ForegroundColor Yellow

# Get the portable executable path
$portableExe = Get-ChildItem -Path "dist" -Filter "*.exe" -Recurse | Where-Object { $_.Name -notlike "*Setup*" } | Select-Object -First 1

if ($portableExe) {
    $portableDir = $portableExe.Directory.FullName
    $zipName = "TimeLogger-1.0.0-portable.zip"
    $zipPath = Join-Path "$PSScriptRoot\Electron\dist" $zipName
    
    # Remove existing zip if present
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    # Create zip archive
    Write-Host "Creating $zipName..." -ForegroundColor Cyan
    Compress-Archive -Path "$portableDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
    
    Write-Host "Portable package created: $zipPath" -ForegroundColor Green
}

# Return to root directory
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Packaging completed successfully!   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output files:" -ForegroundColor Cyan

# List created files
$distPath = Join-Path $PSScriptRoot "Electron\dist"
if (Test-Path $distPath) {
    Get-ChildItem $distPath -Recurse -Include "*.exe","*.zip" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor White
        Write-Host "    $($_.FullName)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Installation instructions:" -ForegroundColor Cyan
Write-Host "  Installer: Run 'Time Logger Setup 1.0.0.exe'" -ForegroundColor White
Write-Host "  Portable:  Extract ZIP and run 'Time Logger.exe'" -ForegroundColor White
Write-Host ""
