const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');

let mainWindow;
let backendProcess;
let apiPort = 5000;
let isPortableMode = false;
let databasePath = '';

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
  
  if (isPortableMode) {
    // Portable mode: database in Data folder next to app
    const dataDir = isDev 
      ? path.join(__dirname, 'Data')
      : path.join(process.resourcesPath, 'Data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    databasePath = path.join(dataDir, 'timelogger.db');
  } else {
    // Installed mode: database in user's AppData
    const userDataPath = app.getPath('userData');
    const dataDir = userDataPath;
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    databasePath = path.join(dataDir, 'timelogger.db');
  }
  
  console.log('Portable Mode:', isPortableMode);
  console.log('Database Path:', databasePath);
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
    await startBackend();
    createWindow();

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
