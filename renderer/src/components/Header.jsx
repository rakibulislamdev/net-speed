// renderer/src/components/Header.jsx
import React from "react";

export function Header({ snapshot }) {
  const version = snapshot?.version || "1.0.0";
  const ssid = snapshot?.ssid;
  const iface = snapshot?.iface || "Detecting...";

  return (
    <header className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5">
        {/* Same UP/DOWN Arrow icon as taskbar */}
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center p-1.5 shadow-sm">
          <img src="./tray-icon.png" alt="NetSpeed" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-white tracking-tight">NetSpeed</h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 font-mono">
              v{version}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Interface: <span className="text-slate-200">{iface}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-300">
          <svg className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span className="font-medium truncate max-w-[140px]">
            {ssid ? ssid : "Ethernet"}
          </span>
        </div>
      </div>
    </header>
  );
}
