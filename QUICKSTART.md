# 🚀 Quick Start Guide

## Prerequisites Check

Before starting, verify you have these installed:

```powershell
# Check Node.js (REQUIRED - if not installed, get it from https://nodejs.org/)
node --version

# Check .NET (Already installed ✓)
dotnet --version
```

## Three Simple Steps

### 1️⃣ Setup (First Time Only)

Run this once to install all dependencies:

```powershell
.\setup.ps1
```

This will:
- Verify Node.js and .NET are installed
- Install frontend dependencies (React, Vite, etc.)
- Install Electron dependencies

### 2️⃣ Build

Build the complete application:

```powershell
.\build.ps1
```

This will:
- Compile the C# backend
- Build the React frontend  
- Package everything for Electron

### 3️⃣ Run

Start the application:

```powershell
cd Electron
npm start
```

The Time Logger app will launch!

## What You'll See

When the app starts, you'll see:

1. **Weekly View Tab**: Your main workspace
   - Weekly calendar with Monday start
   - Time entries organized by day
   - Project totals and weekly total
   - Quick add/edit buttons

2. **Manage Tab**: Setup area
   - Add/edit customers
   - Add/edit projects
   - Archive unused items

## First-Time Usage

1. Go to **Manage** tab
2. Add your first customer (e.g., "Acme Corp")
3. Add a project for that customer (e.g., Project #2024-001)
4. Go back to **Weekly View**
5. Click **+ New Entry**
6. Select customer, project, enter hours
7. Click **Create**

That's it! The app will remember your last-used customer and project for faster entry next time.

## Keyboard Tips

- **Enter** = Save entry
- **Esc** = Cancel dialog
- **Tab** = Navigate between fields
- Use "Today" and "Yesterday" buttons for quick date selection

## Troubleshooting

### "Node.js not found"
Install Node.js from https://nodejs.org/

### Build fails
Make sure you ran `.\setup.ps1` first

### Backend won't start
Check if another app is using port 5000

### Need help?
Check the full README.md for detailed documentation

---

**Happy time tracking! ⏱️**
