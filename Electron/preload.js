const { contextBridge, ipcRenderer } = require('electron');

// Expose API URL and update controls to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, info) => callback(info)),
});

// Listen for API URL from main process
ipcRenderer.on('api-url', (event, url) => {
  window.API_URL = url;
});
