# NetSpeed

A lightweight, production-grade cross-platform (Windows 11 & macOS) desktop tray/menubar application that monitors live network download and upload speeds every second, with a clean on-demand React + Tailwind CSS dashboard.

---

## Features

- **Zero-window startup**: Lives silently in your Windows Tray or macOS Menubar.
- **Real-time network meter**: Updates every ~1 second with non-overlapping polling.
- **Native Canvas-free Windows Tray**: Custom 3x5 pixel font renders download/upload rates on a 16x16 icon without heavy native canvas binaries.
- **macOS Menubar**: Monospaced rate title (`↓ 2.5 MB/s ↑ 400 KB/s`).
- **Auto Interface Switching**: Detects network change (Wi-Fi ↔ Ethernet) within 10–15 seconds.
- **Lazy Dashboard**: Memory is completely released when the window is closed; background tray monitoring continues.
- **Built-in Speed Test**: Live streaming download (~8s) and upload test using Cloudflare's public speed test endpoint.
- **Session Tracker**: Tracks total accumulated bandwidth usage and uptime, with a one-click reset.
- **Preferences**: Toggle between Bits (Mbps) and Bytes (MB/s), with persistent state in `userData/prefs.json`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron v33 |
| Network Data | Node.js + `systeminformation` |
| UI | React 18 + Tailwind CSS v4, bundled with Vite |
| Packaging | electron-builder (NSIS for Windows, DMG for macOS) |
| Persistence | Local JSON file in `userData` (no database) |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Runs Vite dev server on port 5173 and starts Electron:
```bash
npm run dev
```

### 3. Build Renderer
```bash
npm run build
```

### 4. Create Distributable Installer
```bash
npm run dist
```
- **Windows**: Produces an NSIS installer under `dist-package/`.
- **macOS**: Produces a DMG package under `dist-package/`.

---

## Platform-Specific Notes & Gotchas

### Windows 11
1. **Tray Overflow Area**: Windows 11 hides new system tray icons inside the overflow menu (`^`) by default. Drag and drop the NetSpeed icon onto the visible taskbar tray area once.
2. **16x16 Icon Resolution**: The tray icon size is 16x16 pixels. Compact notation (`0K`, `1.5M`, `240K`) is rendered directly on the icon, while full values are displayed on hover tooltip and context menu.

### macOS
1. **SSID Redaction & Location Permission**: On modern macOS (Sonoma, Sequoia, etc.), Wi-Fi SSID may appear redacted or empty unless Location services are granted. `Info.plist` is pre-configured with `NSLocationWhenInUseUsageDescription` and `LSUIElement` (Dock icon hidden).
2. **Launch at Login**: Enabled only for packaged applications (`app.isPackaged`) to avoid pollution in development environments.
3. **Gatekeeper / SmartScreen**: Unsigned builds will prompt security warnings. Sign and notarize binaries for public distribution.

---

## Performance & CPU Measurement

### Target
- **Target CPU usage**: < 1.0% average background usage when the dashboard window is closed.

### How to Measure on Windows
1. Open Windows PowerShell or Command Prompt.
2. Ensure NetSpeed is running in the tray with the dashboard window closed.
3. Run the following command to sample CPU utilization across 10 iterations:
```powershell
Get-Counter "\Process(electron*)\% Processor Time" -Continuous
```
or inspect **Task Manager** → **Details** tab → sort by `electron.exe`.

### Verification Results
- **Chained Timer**: NetSpeed replaces overlapping `setInterval` with chained `setTimeout` loops. The next measurement only schedules after the previous call settles, avoiding CPU spikes.
- **No-op Tray Caching**: If download and upload rates do not change, the 16x16 buffer is not redrawn.
- **IPC Suspension**: When the dashboard window is closed, IPC broadcasts are immediately suspended (`broadcastStatsIfVisible`).
- If Windows WMI calls exceed 1% on low-end hardware, change the polling delay in `electron/monitor.js` from `1000ms` to `2000ms`.

---

## Known Limits

1. **Windows Tray Title Limitation**: Windows does not support dynamic text strings directly in the tray notification area (unlike macOS). NetSpeed overcomes this using a custom 3x5 bitmap renderer inside a 16x16 icon.
2. **Speed Test Endpoint**: Uses Cloudflare Speed Test (`https://speed.cloudflare.com`). Network firewalls blocking Cloudflare will report a connection error in the speed test card.
3. **Single-Instance Enforcement**: Only one instance of NetSpeed can run at a time; running a second instance brings the existing dashboard into focus.

