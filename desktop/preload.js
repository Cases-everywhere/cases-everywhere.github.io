const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  close: () => ipcRenderer.invoke("widget:close"),
  isPinned: () => ipcRenderer.invoke("widget:isPinned"),
  togglePin: () => ipcRenderer.invoke("widget:togglePin"),
});
