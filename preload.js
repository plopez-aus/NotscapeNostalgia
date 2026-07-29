const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notscapeAPI', {
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  savePreferences: (prefs) => ipcRenderer.invoke('save-preferences', prefs),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  maximizeApp: () => ipcRenderer.send('maximize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  dismissSplash: () => ipcRenderer.send('dismiss-splash'),
  showSplash: () => ipcRenderer.send('show-splash'),
  newWindow: () => ipcRenderer.send('new-window')
});
