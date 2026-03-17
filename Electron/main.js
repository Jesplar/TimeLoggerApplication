const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let backendProcess;
let apiPort = 5000;
let isPortableMode = false;
let databasePath = '';

// Get the path to db-config.json
function getConfigPath() {
  const isDev = !app.isPackaged;
  if (isPortableMode) {
    return isDev
      ? path.join(__dirname, 'db-config.json')
      : path.join(process.resourcesPath, 'db-config.json');
  }
  return path.join(app.getPath('userData'), 'db-config.json');
}

function loadDbConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read db-config.json:', err);
  }
  return {};
}

function saveDbConfig(config) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('Saved db-config.json:', configPath);
  } catch (err) {
    console.error('Failed to write db-config.json:', err);
  }
}

// Detect portable mode and set database path
function detectPortableModeAndSetupDatabase() {
  const isDev = !app.isPackaged;
  
  // Check for portable.txt marker file
  let portableMarkerPath;
  if (isDev) {
    portableMarkerPath = path.join(__dirname, 'portable.txt');
  } else {
    portableMarkerPath = path.join(process.resourcesPath, 'portable.txt');
  }
  
  isPortableMode = fs.existsSync(portableMarkerPath);
  
  // Compute default path
  let defaultPath;
  if (isPortableMode) {
    const dataDir = isDev 
      ? path.join(__dirname, 'Data')
      : path.join(process.resourcesPath, 'Data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    defaultPath = path.join(dataDir, 'timelogger.db');
  } else {
    const userDataPath = app.getPath('userData');
    
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    defaultPath = path.join(userDataPath, 'timelogger.db');
  }

  // Check config file for a custom path
  const config = loadDbConfig();
  if (config.databasePath) {
    databasePath = config.databasePath;
  } else {
    databasePath = defaultPath;
    saveDbConfig({ databasePath });
  }
  
  console.log('Portable Mode:', isPortableMode);
  console.log('Database Path:', databasePath);
}

// Validate the database path exists; if not, prompt the user
async function validateDatabasePath() {
  if (fs.existsSync(databasePath)) {
    return; // File exists, nothing to do
  }

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Database Not Found',
    message: `Database file not found:\n${databasePath}`,
    detail: 'Would you like to create a new database at this location, or browse for an existing database file?',
    buttons: ['Create New Database', 'Browse...'],
    defaultId: 0,
    noLink: true,
  });

  if (response === 1) {
    // Browse for existing database
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Select Database File',
      defaultPath: path.dirname(databasePath),
      filters: [
        { name: 'SQLite Database', extensions: ['db'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!canceled && filePaths.length > 0) {
      databasePath = filePaths[0];
      saveDbConfig({ databasePath });
      console.log('User selected database:', databasePath);
      return;
    }

    // User cancelled the browse dialog — fall through to create new
  }

  // Create New: ensure the directory exists, backend will create the file via MigrateAsync
  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  saveDbConfig({ databasePath });
  console.log('Will create new database at:', databasePath);
}

// Find available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Start the backend API server
async function startBackend() {
  return new Promise(async (resolve, reject) => {
    try {
      apiPort = await findAvailablePort(5000);
      
      let backendExe;
      const isDev = !app.isPackaged;
      
      if (isDev) {
        // Development mode - use local build
        backendExe = path.join(__dirname, 'backend', 'TimeLoggerAPI.exe');
      } else {
        // Production mode - backend is unpacked from asar
        // Try app.asar.unpacked first, then fall back to app
        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'TimeLoggerAPI.exe');
        const appPath = path.join(process.resourcesPath, 'app', 'backend', 'TimeLoggerAPI.exe');
        
        const fs = require('fs');
        if (fs.existsSync(unpackedPath)) {
          backendExe = unpackedPath;
        } else if (fs.existsSync(appPath)) {
          backendExe = appPath;
        } else {
          backendExe = path.join(__dirname, 'backend', 'TimeLoggerAPI.exe');
        }
      }

      console.log('Is Packaged:', app.isPackaged);
      console.log('__dirname:', __dirname);
      console.log('process.resourcesPath:', process.resourcesPath);
      console.log('Starting backend:', backendExe);
      console.log('API Port:', apiPort);
      console.log('Database Path:', databasePath);
      
      // Check if backend exists
      if (!fs.existsSync(backendExe)) {
        console.error('Backend executable not found at:', backendExe);
        reject(new Error('Backend executable not found'));
        return;
      }

      backendProcess = spawn(backendExe, [], {
        env: {
          ...process.env,
          ASPNETCORE_URLS: `http://localhost:${apiPort}`,
          DATABASE_PATH: databasePath
        }
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
      });

      backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        reject(error);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
      });

      // Wait a bit for the server to start
      setTimeout(() => resolve(), 3000);
    } catch (error) {
      reject(error);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const frontendPath = path.join(__dirname, 'frontend', 'index.html');
  const hasBuiltFrontend = fs.existsSync(frontendPath);
  
  if (!hasBuiltFrontend) {
    // Development mode - load from Vite dev server
    console.log('Loading from Vite dev server...');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    console.log('Loading from built files...');
    mainWindow.loadFile(frontendPath);
  }

  // Send API URL to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('api-url', `http://localhost:${apiPort}/api`);
  });
}

app.whenReady().then(async () => {
  try {
    detectPortableModeAndSetupDatabase();
    await validateDatabasePath();
    await startBackend();
    createWindow();

    // Check for updates after window is ready (installed mode only)
    if (app.isPackaged && !isPortableMode) {
      setupAutoUpdater();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC handlers
ipcMain.handle('get-api-url', () => {
  return `http://localhost:${apiPort}/api`;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', () => {
  if (app.isPackaged && !isPortableMode) {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.handle('select-database', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Database File',
    defaultPath: path.dirname(databasePath),
    filters: [
      { name: 'SQLite Database', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (!canceled && filePaths.length > 0) {
    const newPath = filePaths[0];
    saveDbConfig({ databasePath: newPath });
    return { path: newPath, changed: true };
  }
  return { path: databasePath, changed: false };
});

ipcMain.handle('get-database-path', () => {
  return databasePath;
});

// Auto-updater setup
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available`,
      detail: 'Download and install now? The app will restart when complete.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
        if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading' });
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('App is up to date.');
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'up-to-date' });
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    console.log(`Download progress: ${percent}%`);
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloading', percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} downloaded`,
      detail: 'Restart the application to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    if (mainWindow) mainWindow.webContents.send('update-status', { status: 'error', message: error.message });
  });

  // Check 5 seconds after startup to not delay app launch
  setTimeout(() => autoUpdater.checkForUpdates(), 5000);
}
