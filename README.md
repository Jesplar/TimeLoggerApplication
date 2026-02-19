# Time Logger Application

A desktop time tracking application built with Electron, React, C# ASP.NET Core, and SQL Server LocalDB.

## Features

- ⏱️ Log time entries with flexible input (hours or start/end times)
- 📅 Weekly overview with Monday start, filtering, and summaries
- 📊 Project totals and weekly hour summations
- 📈 **NEW: Comprehensive Reports tab with Excel export**
- 👥 Manage customers and projects (create, edit, archive, delete)
- 📝 Add descriptions/notes to time entries
- 📤 Export time entries to CSV
- 📥 **NEW: Export 8 different management reports to Excel**
- 💾 Smart defaults remember last-used customer and project
- 🖥️ Self-contained desktop application
- 🗄️ SQL Server LocalDB for enterprise-grade data storage

## Reports Available

Generate and export management reports directly from the application:

1. **Monthly Summary by Customer** - Total hours per customer
2. **Monthly Summary by Project** - Detailed project breakdown for invoicing
3. **Invoice Preparation** - Custom date range with full details
4. **Weekly Timesheet** - Monday-Sunday breakdown
5. **Customer Activity Report** - Engagement analysis
6. **Project Status Report** - Overview with last activity
7. **Year-to-Date Summary** - Annual performance metrics
8. **Month-by-Month Comparison** - 6-month trend analysis

All reports can be exported to Excel with one click!

## Prerequisites

Before you can run this application, you need to install:

1. **Node.js** (v18 or later)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **.NET SDK** (v8.0 or later) - Already installed ✓
   - Verify: `dotnet --version`

## Setup Instructions

### 1. Install Frontend Dependencies

```powershell
cd Frontend
npm install
```

### 2. Install Electron Dependencies

```powershell
cd ..\Electron
npm install
```

### 3. Build the Backend

```powershell
cd ..\Backend\TimeLoggerAPI
dotnet publish -c Release -r win-x64 --self-contained -o ..\..\Electron\backend
```

### 4. Build the Frontend

```powershell
cd ..\..\Frontend
npm run build
```

### 5. Copy Frontend Build to Electron

```powershell
# Create frontend directory in Electron if it doesn't exist
mkdir ..\Electron\frontend -Force

# Copy all built files
Copy-Item -Path .\dist\* -Destination ..\Electron\frontend -Recurse -Force
```

## Running the Application

### Development Mode

For development, you can run the frontend and backend separately:

1. **Start the Backend:**
   ```powershell
   cd Backend\TimeLoggerAPI
   dotnet run
   ```
   Backend will be available at: http://localhost:5000

2. **Start the Frontend (in a new terminal):**
   ```powershell
   cd Frontend
   npm run dev
   ```
   Frontend will be available at: http://localhost:5173

3. **Run Electron (in a new terminal):**
   ```powershell
   cd Electron
   npm start
   ```

### Production Mode

After building (steps 3-5 above):

```powershell
cd Electron
npm start
```

## Building Distributable Package

To create an installer:

```powershell
cd Electron
npm run build
```

The installer will be created at:
```
Electron\dist\Time Logger Setup 1.0.0.exe
```

**What it includes:**
- Complete Electron app
- Backend API (.NET executable)
- Frontend (React UI)
- SQLite database support

**Installation:**
1. Run the installer
2. App installs to: `C:\Users\[YourName]\AppData\Local\Programs\time-logger\`
3. Database saves to: `C:\Users\[YourName]\AppData\Local\Programs\time-logger\resources\app.asar.unpacked\backend\timelogger.db`
4. Shortcut added to Start Menu

**Note:** The backend executable is unpacked from the asar archive to ensure proper execution.

## Project Structure

```
TimeLoggerApplication/
├── Backend/
│   └── TimeLoggerAPI/          # C# ASP.NET Core Web API
│       ├── Controllers/        # API endpoints
│       ├── Data/              # Database context
│       ├── DTOs/              # Data transfer objects
│       └── Models/            # Entity models
├── Frontend/
│   └── src/
│       ├── components/        # React components
│       ├── utils/            # Utility functions
│       ├── api.ts            # API client
│       ├── types.ts          # TypeScript types
│       └── store.ts          # State management
└── Electron/
    ├── main.js               # Electron main process
    ├── preload.js           # Electron preload script
    ├── backend/             # Published backend (after build)
    └── frontend/            # Built frontend (after build)
```

## Usage

### Adding Time Entries

1. Click "+ New Entry" button
2. Select customer and project (last used will be pre-selected)
3. Choose date (use "Today" or "Yesterday" shortcuts)
4. Select entry mode:
   - **Hours**: Enter total hours worked (e.g., 8, 7.5)
   - **Start/End Times**: Enter start and end times
5. Optionally add a description
6. Click "Create"

### Weekly Overview

- Navigate weeks using "← Prev Week", "Today", "Next Week →" buttons
- Click any time entry to edit it
- Click "+" on a day to add entry for that specific date
- Filter by customer or project using dropdowns
- View project totals and weekly total at the top

### Managing Customers & Projects

1. Go to "Manage" tab
2. Switch between "Customers" and "Projects" tabs
3. Click "+ Add Customer" or "+ Add Project"
4. Edit or delete existing items
5. Use "Show Inactive" checkbox to view archived items

### Exporting Data

Click "Export to CSV" in the Weekly View to download time entries for the current week.

## Database

The application uses **SQL Server LocalDB** for data storage. The database `TimeLogger` is automatically created on first run.

**Connection Details:**
- Server: `(localdb)\mssqllocaldb`
- Database: `TimeLogger`
- Authentication: Windows Authentication (Trusted Connection)

**Accessing the Database in SSMS:**
1. Open SQL Server Management Studio (SSMS)
2. Connect to: `(localdb)\mssqllocaldb`
3. Find the `TimeLogger` database in the Object Explorer

**Connection String:**
```
Server=(localdb)\mssqllocaldb;Database=TimeLogger;Trusted_Connection=true;MultipleActiveResultSets=true
```

**Database Tables:**
- `Customers` - Customer information
- `Projects` - Projects linked to customers
- `TimeEntries` - Time logs for each project

**To backup the database:**
```sql
BACKUP DATABASE TimeLogger 
TO DISK = 'C:\Backups\TimeLogger.bak'
WITH FORMAT, INIT, NAME = 'TimeLogger Full Backup';
```

**Note:** The database file is stored in LocalDB's default location, typically:
```
C:\Users\[YourName]\AppData\Local\Microsoft\Microsoft SQL Server Local DB\Instances\mssqllocaldb\
```

## Troubleshooting

### Backend doesn't start
- Ensure .NET SDK is installed
- Check if port 5000 is available
- Look for error messages in the Electron console

### Frontend doesn't load
- Ensure Node.js is installed
- Run `npm install` in the Frontend directory
- Check browser console for errors

### Data not persisting
- Check file permissions in the application directory
- Ensure the database file isn't locked by another process

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Zustand, date-fns, Axios
- **Backend**: ASP.NET Core 10, Entity Framework Core, SQLite
- **Desktop**: Electron 28
- **Build**: electron-builder

## License

MIT
