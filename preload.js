const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // can add IPC handlers later
});
