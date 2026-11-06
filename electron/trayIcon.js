// electron/trayIcon.js
// Loads the high-DPI filled gradient speed icon (matching Lightshot's vivid visual style).

const { nativeImage } = require("electron");
const path = require("node:path");

class TrayIconRenderer {
  constructor() {
    this.cachedIcon = null;
  }

  createIcon() {
    if (this.cachedIcon) {
      return this.cachedIcon;
    }

    const iconPath = path.join(__dirname, "tray-icon.png");
    this.cachedIcon = nativeImage.createFromPath(iconPath);
    return this.cachedIcon;
  }
}

module.exports = new TrayIconRenderer();
