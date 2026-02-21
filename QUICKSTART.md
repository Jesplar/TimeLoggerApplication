# 🚀 Time Logger - Quick Start Guide

## For End Users

### Installing Time Logger

1. **Download** the installer: `Time Logger Setup 1.0.0.exe`
2. **Run** the installer
3. **Launch** from Start Menu

Database location: `%LOCALAPPDATA%\TimeLogger\timelogger.db`

### Using Portable Version

1. **Download** `TimeLogger-1.0.0-portable.zip`
2. **Extract** anywhere (USB drive, folder, etc.)
3. **Run** `Time Logger.exe`

Database location: `Data` folder in application directory

### First Steps

1. **Add Customer**: Manage tab → Customers → + Add Customer
2. **Add Project**: Manage tab → Projects → + Add Project
3. **Log Time**: Time Entries tab → + New Entry
4. **Create Invoice**: Reports tab → Select dates → Export to Excel

### Backup Your Data

Copy `timelogger.db` file to safe location. Find location in: Settings → Database tab

---

## For Developers

### Quick Development Setup

```powershell
# 1. Install dependencies (first time only)
cd Frontend
npm install
cd ..\Electron
npm install
cd ..

# 2. Build and run
.\build.ps1
cd Electron
npm start
```

### Create Installer/Portable Packages

```powershell
.\package.ps1
```

Creates:
- `Electron\dist\Time Logger Setup 1.0.0.exe` - Installer
- `Electron\dist\TimeLogger-1.0.0-portable.zip` - Portable version

### Development Workflow

1. Make changes in `Backend` or `Frontend`
2. Run `.\build.ps1`
3. Test with `cd Electron; npm start`
4. Package with `.\package.ps1`

### Scripts

- `build.ps1` - Build backend + frontend + copy to Electron
- `package.ps1` - Create installer and portable ZIP

### Database

- **Type**: SQLite (single file)
- **Dev Location**: `Electron\Data\timelogger.db`
- **Installed**: `%LOCALAPPDATA%\TimeLogger\timelogger.db`
- **Portable**: `<AppFolder>\Data\timelogger.db`

---

## Troubleshooting

### App Won't Start

```powershell
# Verify prerequisites
node --version  # Should be 18+
dotnet --version  # Should be 10+
```

### Database Issues

- Check Settings → Database tab for location
- Verify file permissions
- Ensure file isn't locked

### Changes Not Appearing (Dev)

- Run `.\build.ps1`
- Restart Electron
- Hard refresh (Ctrl+Shift+R)

---

## Common Tasks

**Backup**: Copy `timelogger.db` file

**Restore**: Replace `timelogger.db` with backup (app closed)

**Find Database**: Settings → Database → Location

**Switch to Portable**: Create empty `portable.txt` file next to exe, restart app

**Switch to Installed**: Delete `portable.txt`, restart app
