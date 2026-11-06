// electron/prefs.js
// Reads and persists user preferences in a JSON file inside app's userData folder.

const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_PREFS = {
  bits: false,
  launchAtLogin: false
};

class Preferences {
  constructor() {
    this.filePath = path.join(app.getPath("userData"), "prefs.json");
    this.prefs = { ...DEFAULT_PREFS };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          if (typeof parsed.bits === "boolean") {
            this.prefs.bits = parsed.bits;
          }
        }
      }
    } catch {
      // Revert to defaults if file is corrupt or unreadable
      this.prefs = { ...DEFAULT_PREFS };
    }

    // Determine current OS login item setting for packaged build
    try {
      const loginItem = app.getLoginItemSettings();
      this.prefs.launchAtLogin = loginItem.openAtLogin;
    } catch {
      this.prefs.launchAtLogin = false;
    }
  }

  save() {
    try {
      const dataToSave = {
        bits: Boolean(this.prefs.bits)
      };
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch {
      // Ignore write errors silently to prevent app crash
    }
  }

  get() {
    return { ...this.prefs };
  }

  update(patch) {
    if (!patch || typeof patch !== "object") return this.get();

    if (typeof patch.bits === "boolean") {
      this.prefs.bits = patch.bits;
      this.save();
    }

    if (typeof patch.launchAtLogin === "boolean") {
      // launchAtLogin is only applied if app is packaged to avoid dev issues
      if (app.isPackaged) {
        try {
          app.setLoginItemSettings({
            openAtLogin: patch.launchAtLogin,
            openAsHidden: true
          });
          this.prefs.launchAtLogin = app.getLoginItemSettings().openAtLogin;
        } catch {
          // Keep current setting on error
        }
      } else {
        // Dev environment does not persist login item
        this.prefs.launchAtLogin = false;
      }
    }

    return this.get();
  }
}

module.exports = new Preferences();

