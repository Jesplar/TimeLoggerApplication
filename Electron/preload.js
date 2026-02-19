const { contextBridge, ipcRenderer } = require('electron');

// Expose API URL to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => ipcRenderer.invoke('get-api-url')
});

// Listen for API URL from main process
ipcRenderer.on('api-url', (event, url) => {
  window.API_URL = url;
});
