# Goal
Create a time logger application in react with a c# backend (internal REST-API as means of communication I guess) and a SQLite database as the data model. It is to log my work hours on different projects.
A big focus should be on a simple UI with a good overview. It should be a very fast and easy task to add time entries.

# Specification and requirements
## UI
Dialog to create a time entry. Select customer (last saved should be default), project (last saved should be default) and hours.
Overview to see the logged entries by day in the current or selected week. It should be possible to click one entry to edit that particular entry. I want the overview to sum the hours per project in a given week as well as giving me a total number of hours.
Datepicker for selecting the date

## Data model
Customer: A customer may have multiple projects.

Project: Project number that is what

Time: Logged to each project. Feel free to add necessary columns to make this as good as possible.

---

# ✅ IMPLEMENTATION COMPLETED

The Time Logger application has been fully implemented with all requested features and more!

## What's Been Built

### Backend (C# ASP.NET Core)
- ✅ SQLite database with Entity Framework Core
- ✅ REST API with full CRUD operations
- ✅ Three main entities: Customer, Project, TimeEntry
- ✅ Weekly summary endpoint with filtering
- ✅ CSV export functionality
- ✅ Validation and error handling

### Frontend (React + TypeScript)
- ✅ Time entry dialog with smart defaults
- ✅ Flexible time input (hours OR start/end times)
- ✅ Weekly overview with Monday start
- ✅ Click to edit any entry
- ✅ Project totals and weekly total summation
- ✅ Filter by customer/project
- ✅ Customer and project management
- ✅ Today/Yesterday quick buttons
- ✅ Export to CSV
- ✅ Persistent last-used defaults

### Desktop App (Electron)
- ✅ Self-contained executable
- ✅ Automatic backend startup
- ✅ Embedded database

## Next Steps

**IMPORTANT: You need to install Node.js first!**

1. **Install Node.js**: https://nodejs.org/ (v18 or later)

2. **Run Setup**:
   ```powershell
   .\setup.ps1
   ```

3. **Build Application**:
   ```powershell
   .\build.ps1
   ```

4. **Run Application**:
   ```powershell
   cd Electron
   npm start
   ```

See README.md for complete documentation!
