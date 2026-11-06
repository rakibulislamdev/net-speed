// electron/tray.js
// Clean system tray icon, live hover tooltip, and context menu.

const { Tray, Menu, nativeImage, app } = require("electron");
const trayIconRenderer = require("./trayIcon");
const { formatSpeed, formatTotalBytes } = require("./format");
const prefs = require("./prefs");

class TrayManager {
  constructor() {
    this.tray = null;
    this.lastState = null;
    this.callbacks = {
      onOpenDashboard: () => {},
      onAutoStartSpeedTest: () => {},
      onResetSession: () => {}
    };
  }

  init(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };

    const initialIcon = trayIconRenderer.createIcon();
    this.tray = new Tray(initialIcon);
    this.tray.setToolTip("NetSpeed: Initializing...");

    if (process.platform === "win32") {
      this.tray.on("click", () => {
        this.callbacks.onOpenDashboard();
      });
      this.tray.on("right-click", () => {
        const menu = this.buildContextMenu();
        this.tray.popUpContextMenu(menu);
      });
    } else {
      this.tray.on("click", () => {
        const menu = this.buildContextMenu();
        this.tray.popUpContextMenu(menu);
      });
      this.tray.on("right-click", () => {
        const menu = this.buildContextMenu();
        this.tray.popUpContextMenu(menu);
      });
    }
  }

  buildContextMenu() {
    const s = this.lastState || {};
    const currentPrefs = prefs.get();
    const inBits = Boolean(currentPrefs.bits);

    const downFormatted = formatSpeed(s.rx || 0, inBits);
    const upFormatted = formatSpeed(s.tx || 0, inBits);
    const totalUsage = formatTotalBytes((s.sessionRx || 0) + (s.sessionTx || 0));
    const sessionDown = formatTotalBytes(s.sessionRx || 0);
    const sessionUp = formatTotalBytes(s.sessionTx || 0);

    const wifiText = s.ssid ? `Wi-Fi: ${s.ssid}` : "Not connected to Wi-Fi";
    const ifaceText = s.iface
      ? `${s.iface} (↓ ${downFormatted}  ↑ ${upFormatted})`
      : `Network (↓ ${downFormatted}  ↑ ${upFormatted})`;

    const template = [
      {
        label: `NetSpeed v${app.getVersion()}`,
        enabled: false
      },
      {
        label: wifiText,
        enabled: false
      },
      {
        label: ifaceText,
        enabled: false
      },
      {
        label: `Session: ${totalUsage} (↓ ${sessionDown} / ↑ ${sessionUp})`,
        enabled: false
      },
      { type: "separator" },
      {
        label: "Reset session counter",
        click: () => {
          this.callbacks.onResetSession();
        }
      },
      {
        label: "Run speed test",
        click: () => {
          this.callbacks.onAutoStartSpeedTest();
        }
      },
      {
        label: "Open dashboard",
        click: () => {
          this.callbacks.onOpenDashboard();
        }
      },
      { type: "separator" },
      {
        label: "Display speed in Mbps (Megabits)",
        type: "checkbox",
        checked: inBits,
        click: (menuItem) => {
          prefs.update({ bits: menuItem.checked });
          if (this.lastState) {
            this.update(this.lastState);
          }
        }
      },
      {
        label: app.isPackaged
          ? "Run on system startup"
          : "Run on system startup (Packaged only)",
        type: "checkbox",
        checked: currentPrefs.launchAtLogin,
        enabled: app.isPackaged,
        click: (menuItem) => {
          prefs.update({ launchAtLogin: menuItem.checked });
        }
      },
      { type: "separator" },
      {
        label: "Quit NetSpeed",
        click: () => {
          app.quit();
        }
      }
    ];

    return Menu.buildFromTemplate(template);
  }

  update(state) {
    if (!this.tray) return;
    this.lastState = state;

    const currentPrefs = prefs.get();
    const inBits = Boolean(currentPrefs.bits);

    const downFormatted = formatSpeed(state.rx || 0, inBits);
    const upFormatted = formatSpeed(state.tx || 0, inBits);

    // Crystal clear multi-line tooltip on hover
    const tooltipText = `NetSpeed\n↓ ${downFormatted}\n↑ ${upFormatted}\nInterface: ${state.iface || "Wi-Fi"}`;
    this.tray.setToolTip(tooltipText);

    if (process.platform === "darwin") {
      this.tray.setTitle(`↓ ${downFormatted}  ↑ ${upFormatted}`);
    } else {
      const icon = trayIconRenderer.createIcon();
      this.tray.setImage(icon);
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = new TrayManager();
