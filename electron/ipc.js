// electron/ipc.js
// Handles all IPC communications between renderer and main process.

const { ipcMain } = require("electron");
const monitor = require("./monitor");
const prefs = require("./prefs");
const windowManager = require("./window");
const tray = require("./tray");

function registerIpcHandlers() {
  // getSnapshot: renderer -> main (invoke)
  ipcMain.handle("netspeed:get-snapshot", () => {
    return monitor.getSnapshot();
  });

  // setPrefs: renderer -> main (invoke)
  ipcMain.handle("netspeed:set-prefs", (_event, patch) => {
    if (!patch || typeof patch !== "object") {
      return monitor.getSnapshot();
    }

    const sanitized = {};
    if (typeof patch.bits === "boolean") sanitized.bits = patch.bits;
    if (typeof patch.launchAtLogin === "boolean") sanitized.launchAtLogin = patch.launchAtLogin;

    prefs.update(sanitized);

    // Refresh tray icon/title immediately with the new setting
    const freshState = monitor.getSnapshot();
    tray.update(freshState);

    return freshState;
  });

  // resetSession: renderer -> main (invoke)
  ipcMain.handle("netspeed:reset-session", () => {
    monitor.resetSession();
    return monitor.getSnapshot();
  });

  // window controls for native OS window titlebars
  ipcMain.on("netspeed:minimize-window", () => {
    windowManager.minimizeWindow();
  });

  ipcMain.on("netspeed:toggle-maximize-window", () => {
    windowManager.toggleMaximize();
  });

  ipcMain.on("netspeed:close-window", () => {
    windowManager.closeWindow();
  });
}

/**
 * Broadcasts monitor updates to renderer ONLY if the dashboard window is currently open/visible.
 * @param {Object} state
 */
function broadcastStatsIfVisible(state) {
  if (windowManager.isOpen()) {
    windowManager.sendToRenderer("netspeed:stats", state);
  }
}

module.exports = {
  registerIpcHandlers,
  broadcastStatsIfVisible
};

