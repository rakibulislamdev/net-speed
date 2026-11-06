// electron/window.js
// Clean window management supporting native resize, snap, maximize, and OS-specific titlebars.

const { BrowserWindow, shell } = require("electron");
const path = require("node:path");

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.pendingSpeedTestTrigger = false;
  }

  getOrCreateWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.show();
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const isMac = process.platform === "darwin";
    const iconPath = process.platform === "win32"
      ? path.join(__dirname, "icon.ico")
      : path.join(__dirname, "icon.png");

    this.mainWindow = new BrowserWindow({
      width: 480,
      height: 600,
      minWidth: 380,
      minHeight: 480,
      icon: iconPath,
      show: false,
      frame: false, // Clean borderless with custom OS-specific window controls
      transparent: false, // Ensures solid snappy resize & snap without GPU lag
      backgroundColor: "#11141c",
      resizable: true,
      maximizable: true,
      center: true, // Centers on screen nicely
      titleBarStyle: isMac ? "hiddenInset" : "hidden",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("http:") || url.startsWith("https:")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    // Notify renderer on maximize/unmaximize state for toggling the restore icon
    this.mainWindow.on("maximize", () => {
      this.sendToRenderer("netspeed:window-maximized-state", true);
    });
    this.mainWindow.on("unmaximize", () => {
      this.sendToRenderer("netspeed:window-maximized-state", false);
    });

    const isDev = process.env.NODE_ENV === "development" || !process.mainModule?.filename?.includes("app.asar");
    const devUrl = process.env.NETSPEED_FRONTEND_URL || "http://localhost:5173";

    if (process.env.NETSPEED_FRONTEND_URL || (!this.isProduction() && !process.env.ELECTRON_PROD)) {
      this.mainWindow.loadURL(devUrl).catch(() => {
        this.loadBuiltFile();
      });
    } else {
      this.loadBuiltFile();
    }

    this.mainWindow.once("ready-to-show", () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.show();
        if (this.pendingSpeedTestTrigger) {
          this.pendingSpeedTestTrigger = false;
          this.triggerSpeedTest();
        }
      }
    });

    return this.mainWindow;
  }

  loadBuiltFile() {
    const indexPath = path.join(__dirname, "../renderer/dist/index.html");
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.loadFile(indexPath);
    }
  }

  isProduction() {
    return process.env.NODE_ENV === "production" || require("electron").app.isPackaged;
  }

  isOpen() {
    return this.mainWindow != null && !this.mainWindow.isDestroyed() && this.mainWindow.isVisible();
  }

  sendToRenderer(channel, ...args) {
    if (this.isOpen()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  triggerSpeedTest() {
    if (this.isOpen()) {
      this.mainWindow.webContents.send("netspeed:auto-start-speed-test");
    } else {
      this.pendingSpeedTestTrigger = true;
      this.getOrCreateWindow();
    }
  }

  minimizeWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.minimize();
    }
  }

  toggleMaximize() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  closeWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }
}

module.exports = new WindowManager();
