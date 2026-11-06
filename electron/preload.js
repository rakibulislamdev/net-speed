// electron/preload.js
// Exposes secure netspeed API to renderer via contextBridge.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("netspeed", {
  platform: process.platform === "win32" ? "win32" : "darwin",

  getSnapshot: async () => {
    return await ipcRenderer.invoke("netspeed:get-snapshot");
  },

  onStats: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, stats) => callback(stats);
    ipcRenderer.on("netspeed:stats", listener);

    return () => {
      ipcRenderer.removeListener("netspeed:stats", listener);
    };
  },

  setPrefs: async (prefsPatch) => {
    return await ipcRenderer.invoke("netspeed:set-prefs", prefsPatch);
  },

  resetSession: async () => {
    return await ipcRenderer.invoke("netspeed:reset-session");
  },

  onAutoStartSpeedTest: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = () => callback();
    ipcRenderer.on("netspeed:auto-start-speed-test", listener);

    return () => {
      ipcRenderer.removeListener("netspeed:auto-start-speed-test", listener);
    };
  },

  // Native window controls
  minimizeWindow: () => {
    ipcRenderer.send("netspeed:minimize-window");
  },

  toggleMaximizeWindow: () => {
    ipcRenderer.send("netspeed:toggle-maximize-window");
  },

  closeWindow: () => {
    ipcRenderer.send("netspeed:close-window");
  },

  onMaximizedState: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, isMax) => callback(isMax);
    ipcRenderer.on("netspeed:window-maximized-state", listener);

    return () => {
      ipcRenderer.removeListener("netspeed:window-maximized-state", listener);
    };
  }
});
