// renderer/src/components/Settings.jsx
import React from "react";

export function Settings({ prefs, onUpdatePrefs, isPackaged }) {
  const inBits = Boolean(prefs?.bits);
  const launchAtLogin = Boolean(prefs?.launchAtLogin);

  return (
    <div className="clean-card rounded-2xl p-4 flex flex-col gap-3">
      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
        Preferences
      </span>

      <div className="flex flex-col gap-3">
        {/* Bits vs Bytes Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200">
              Display speed in Mbps (Megabits)
            </span>
            <span className="text-[11px] text-slate-400">
              Show speed like your Internet Provider (Mbps) instead of file download speed (MB/s).
            </span>
          </div>

          {/* Standard iOS/macOS HIG style toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={inBits}
            onClick={() => onUpdatePrefs({ bits: !inBits })}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 relative flex items-center ${
              inBits ? "bg-blue-600" : "bg-white/20"
            }`}
          >
            <span
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-out block ${
                inBits ? "translate-x-[18px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-white/[0.06]"></div>

        {/* Run at System Startup Toggle */}
        <div className={`flex items-center justify-between ${!isPackaged ? "opacity-50" : ""}`}>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200">
              Run on system startup
            </span>
            <span className="text-[11px] text-slate-400">
              {isPackaged
                ? "Start NetSpeed automatically when your PC turns on."
                : "Active only in packaged builds."}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            disabled={!isPackaged}
            aria-checked={launchAtLogin}
            onClick={() => {
              if (isPackaged) {
                onUpdatePrefs({ launchAtLogin: !launchAtLogin });
              }
            }}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 relative flex items-center ${
              launchAtLogin ? "bg-blue-600" : "bg-white/20"
            }`}
          >
            <span
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-out block ${
                launchAtLogin ? "translate-x-[18px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
