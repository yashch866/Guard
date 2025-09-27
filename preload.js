const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('system', {
  brightness: {
    get: () => ipcRenderer.invoke('brightness:get'),
    set: (value) => ipcRenderer.invoke('brightness:set', value)
  }
});
