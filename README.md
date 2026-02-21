# Time Logger Application

A desktop time tracking application built with Electron, React, and ASP.NET Core.

## Features

- ⏱️ Log time entries with flexible input (hours or start/end times)
- 📅 Weekly overview with filtering and summaries
- 📊 Project and customer management
- 📈 Comprehensive reports with Excel export
- 📤 Invoice generation with breakdown by time codes
- 💾 SQLite database - no server required
- 🖥️ Runs both installed and portable
- 📦 Single-file database for easy backup

## Quick Start

### Option 1: Use the Build Script (Recommended)

```powershell
.\build.ps1
cd Electron
npm start
```

### Option 2: Create Installer/Portable Package

```powershell
.\package.ps1
```

This creates:
- **Installer**: `Electron\dist\Time Logger Setup 1.0.0.exe`
- **Portable**: `Electron\dist\TimeLogger-1.0.0-portable.zip`

## Installation Modes

### Installed Mode
- Database stored in: `%LOCALAPPDATA%\TimeLogger\timelogger.db`
- Persists across application updates
- Standard Windows installation

### Portable Mode
- Database stored in: `<AppFolder>\Data\timelogger.db`
- Perfect for USB drives
- No installation required
- Determined by presence of `portable.txt` file

## Prerequisites

- **Node.js** (v18 or later) - https://nodejs.org/
- **.NET SDK** (v10 or later) - https://dotnet.microsoft.com/download

Verify installation:
```powershell
node --version
dotnet --version
```

## Development Setup

1. **Install dependencies:**
   ```powershell
   cd Frontend
   npm install
   cd ..\Electron
   npm install
   ```

2. **Build and run:**
   ```powershell
   cd ..
   .\build.ps1
   cd Electron
   npm start
   ```

## Building Packages

### Create Installer and Portable Versions

```powershell
.\package.ps1
```

Output:
- `Electron\dist\Time Logger Setup 1.0.0.exe` - Windows installer
- `Electron\dist\TimeLogger-1.0.0-portable.zip` - Portable version

### Manual Build

```powershell
# Build application
.\build.ps1

# Create packages
cd Electron
npm run build
```

## Project Structure

```
TimeLoggerApplication/
├── Backend/
│   └── TimeLoggerAPI/          # ASP.NET Core Web API
│       ├── Controllers/        # API endpoints
│       ├── Data/              # EF Core DbContext
│       ├── Models/            # Database entities
│       └── Migrations/        # SQLite migrations
├── Frontend/
│   └── src/
│       ├── components/        # React components
│       └── api.ts            # API client
├── Electron/
│   ├── main.js               # Electron main process
│   ├── backend/              # Published .NET API
│   └── frontend/             # Built React app
├── build.ps1                 # Development build script
└── package.ps1              # Production packaging script
```

## Database

**Provider**: SQLite (single-file database)

**Location**:
- Installed: `%LOCALAPPDATA%\TimeLogger\timelogger.db`
- Portable: `<AppFolder>\Data\timelogger.db`

**Backup**: Simply copy the `.db` file

**View Database Info**: Go to Settings → Database tab

## Usage

### Time Entry
1. Click "+ New Entry"
2. Select customer and project
3. Choose date
4. Enter hours or start/end times
5. Add description (optional)
6. Click "Create"

### Reports
1. Go to "Reports" tab
2. Select date range
3. Choose customer/project filters
4. Click "Export to Excel"
5. Opens generated invoice with breakdown

### Settings
- Configure billing rates
- Set currency conversion
- View database information
- Manage time codes and receipt types

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: ASP.NET Core 10 + Entity Framework Core
- **Database**: SQLite
- **Desktop**: Electron 28
- **Packaging**: electron-builder

## Troubleshooting

**App won't start**
- Check if .NET SDK is installed: `dotnet --version`
- Ensure ports 5001 is available
- Check Electron console (Ctrl+Shift+I)

**Database not found**
- Check Settings → Database tab for location
- Verify file permissions
- For portable mode, ensure `portable.txt` exists

**Changes not appearing**
- Run `.\build.ps1` to rebuild
- Hard refresh in app (Ctrl+Shift+R)

## Releasing a New Version

### One-time GitHub Setup

1. In `Electron/package.json`, set your GitHub username and repo name under `build.publish`:
   ```json
   "publish": {
     "provider": "github",
     "owner": "jesplar",
     "repo": "TimeLoggerApplication"
   }
   ```

2. Create a GitHub Personal Access Token with `repo` scope:
   - GitHub → Settings → Developer settings → Personal access tokens → Generate new token
   - Save it somewhere safe

### Publishing a Release (GitHub auto-update)

Installed users will be notified automatically on next launch.

```powershell
# 1. Bump the version in Electron/package.json
#    e.g. "version": "1.0.0"  →  "version": "1.1.0"

# 2. Build and publish to GitHub Releases
$env:GH_TOKEN = "ghp_your_token_here"
.\package.ps1 -Publish
```

This will:
- Build the backend, frontend, and Electron app
- Create the installer and portable packages
- Publish a GitHub Release with all artifacts and a `latest.yml` update manifest
- Existing installed users will see an "Update Available" dialog on next launch

> **Note:** The portable version does not auto-update. Users running portable must download the new release manually.

### Local / Manual Update (no GitHub)

If you distribute updates directly (e.g. via email or shared drive) without GitHub:

```powershell
# Build packages locally (no publish)
.\package.ps1
```

Send the user the new `Time Logger Setup x.x.x.exe` installer.  
They can run it directly over the existing installation — no uninstall required.  
The database in `%LOCALAPPDATA%\TimeLogger\` is never touched by the installer.

---

## Scripts

- `build.ps1` - Build backend, frontend, and copy to Electron
- `package.ps1` - Create installer and portable packages
- `package.ps1 -Publish` - Build and publish a GitHub Release (requires `$env:GH_TOKEN`)

## License

MIT
