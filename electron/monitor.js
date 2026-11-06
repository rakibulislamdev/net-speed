// electron/monitor.js
// Non-overlapping network polling, interface tracking, and session accumulation.

const si = require("systeminformation");
const { app } = require("electron");
const prefs = require("./prefs");

class NetworkMonitor {
  constructor() {
    this.isRunning = false;
    this.pollTimer = null;
    this.wifiTimer = null;
    this.interfaceTimer = null;

    this.defaultInterface = "";
    this.ssid = "";

    // Session accumulation
    this.sessionStart = Date.now();
    this.sessionRx = 0; // Total bytes downloaded
    this.sessionTx = 0; // Total bytes uploaded
    this.lastSampleTime = Date.now();

    // Latest snapshot cache
    this.lastRxSec = 0;
    this.lastTxSec = 0;

    this.onTick = () => {};
  }

  /**
   * Start polling.
   * @param {(state: Object) => void} tickCallback
   */
  start(tickCallback) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onTick = tickCallback || (() => {});
    this.lastSampleTime = Date.now();

    // 1. Initial interface discovery
    this.detectInterface().then(() => {
      // 2. Start chained non-overlapping polling loop
      this.pollCycle();
    });

    // 3. Periodic interface detection (~10 seconds)
    this.interfaceTimer = setInterval(() => {
      this.detectInterface();
    }, 10000);

    // 4. Slow Wi-Fi SSID discovery (~15 seconds)
    this.fetchWifiInfo();
    this.wifiTimer = setInterval(() => {
      this.fetchWifiInfo();
    }, 15000);
  }

  stop() {
    this.isRunning = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.interfaceTimer) clearInterval(this.interfaceTimer);
    if (this.wifiTimer) clearInterval(this.wifiTimer);
  }

  resetSession() {
    this.sessionStart = Date.now();
    this.sessionRx = 0;
    this.sessionTx = 0;
    this.notifyTick();
  }

  async detectInterface() {
    try {
      const iface = await si.networkInterfaceDefault();
      if (iface) {
        this.defaultInterface = iface;
      }
    } catch {
      // Keep previous default interface on failure
    }
  }

  async fetchWifiInfo() {
    try {
      const connections = await si.wifiConnections();
      if (Array.isArray(connections) && connections.length > 0) {
        const primary = connections[0];
        // SSID might be empty or redacted on macOS without location access
        this.ssid = primary.ssid || "";
      } else {
        this.ssid = "";
      }
    } catch {
      this.ssid = "";
    }
  }

  /**
   * Chained polling cycle to strictly avoid overlapping calls.
   */
  async pollCycle() {
    if (!this.isRunning) return;

    const startTime = Date.now();

    try {
      // Pass defaultInterface to reduce overhead if available
      const stats = await si.networkStats(this.defaultInterface || "*");
      const now = Date.now();
      const deltaSec = Math.max(0.1, (now - this.lastSampleTime) / 1000);
      this.lastSampleTime = now;

      let rxSec = 0;
      let txSec = 0;

      if (Array.isArray(stats) && stats.length > 0) {
        // If default interface is found in stats, use it, otherwise take first active
        const targetStat =
          stats.find((s) => s.iface === this.defaultInterface) || stats[0];

        if (targetStat) {
          // If first sample is null or undefined, treat as 0
          rxSec = targetStat.rx_sec != null && !isNaN(targetStat.rx_sec)
            ? Math.max(0, targetStat.rx_sec)
            : 0;
          txSec = targetStat.tx_sec != null && !isNaN(targetStat.tx_sec)
            ? Math.max(0, targetStat.tx_sec)
            : 0;
        }
      }

      this.lastRxSec = rxSec;
      this.lastTxSec = txSec;

      // Accumulate session total bytes (speed * time interval)
      this.sessionRx += rxSec * deltaSec;
      this.sessionTx += txSec * deltaSec;

      this.notifyTick();
    } catch {
      // On network disconnect or error, output 0 without crashing
      this.lastRxSec = 0;
      this.lastTxSec = 0;
      this.notifyTick();
    } finally {
      if (this.isRunning) {
        // Compute remaining time to maintain ~1000ms cadence
        const elapsed = Date.now() - startTime;
        const delay = Math.max(200, 1000 - elapsed);
        this.pollTimer = setTimeout(() => {
          this.pollCycle();
        }, delay);
      }
    }
  }

  getSnapshot() {
    const currentPrefs = prefs.get();
    return {
      timestamp: Date.now(),
      rx: this.lastRxSec,
      tx: this.lastTxSec,
      iface: this.defaultInterface,
      ssid: this.ssid,
      sessionRx: Math.round(this.sessionRx),
      sessionTx: Math.round(this.sessionTx),
      sessionStart: this.sessionStart,
      prefs: {
        bits: currentPrefs.bits,
        launchAtLogin: currentPrefs.launchAtLogin
      },
      version: app.getVersion(),
      packaged: app.isPackaged
    };
  }

  notifyTick() {
    if (typeof this.onTick === "function") {
      this.onTick(this.getSnapshot());
    }
  }
}

module.exports = new NetworkMonitor();

