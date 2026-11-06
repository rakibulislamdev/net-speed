// electron/main.js
// NetSpeed main lifecycle, boot sequence, single-instance lock and background tray.

const { app } = require("electron");
const monitor = require("./monitor");
const tray = require("./tray");
const windowManager = require("./window");
const { registerIpcHandlers, broadcastStatsIfVisible } = require("./ipc");

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    windowManager.getOrCreateWindow();
  });

  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }

  app.on("window-all-closed", (e) => {
    e.preventDefault();
  });

  app.whenReady().then(() => {
    registerIpcHandlers();

    // 1. Initialize clean system tray
    tray.init({
      onOpenDashboard: () => {
        windowManager.getOrCreateWindow();
      },
      onAutoStartSpeedTest: () => {
        windowManager.triggerSpeedTest();
      },
      onResetSession: () => {
        monitor.resetSession();
      }
    });

    // 2. Start background network monitor
    monitor.start((state) => {
      tray.update(state);
      broadcastStatsIfVisible(state);
    });
  });

  app.on("before-quit", () => {
    monitor.stop();
    tray.destroy();
  });
}
