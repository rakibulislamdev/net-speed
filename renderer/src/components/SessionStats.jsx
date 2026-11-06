// renderer/src/components/SessionStats.jsx
import React, { useState, useEffect } from "react";

function formatBytes(bytes) {
  const safe = Math.max(0, Number(bytes) || 0);
  const oneMB = 1024 * 1024;
  const oneGB = 1024 * 1024 * 1024;
  if (safe < oneGB) {
    return `${(safe / oneMB).toFixed(1)} MB`;
  }
  return `${(safe / oneGB).toFixed(2)} GB`;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function SessionStats({ sessionRx, sessionTx, sessionStart, onReset }) {
  const [duration, setDuration] = useState("0s");

  useEffect(() => {
    const updateTime = () => {
      const elapsed = Date.now() - (sessionStart || Date.now());
      setDuration(formatDuration(elapsed));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  const total = (sessionRx || 0) + (sessionTx || 0);

  return (
    <div className="clean-card rounded-2xl p-4 flex flex-col justify-between h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Data Usage This Session
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-full" title="Time since app started or reset">
            {duration}
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="clean-button text-xs font-medium text-slate-200 hover:text-white px-3 py-1 rounded-lg"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center mt-auto">
        <div className="bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-xl">
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider">TOTAL</div>
          <div className="text-base font-bold text-white font-mono mt-0.5">
            {formatBytes(total)}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-xl">
          <div className="text-[10px] text-[#38bdf8] font-semibold tracking-wider flex items-center justify-center gap-1">
            <span>↓</span> DOWN
          </div>
          <div className="text-base font-bold text-sky-200 font-mono mt-0.5">
            {formatBytes(sessionRx)}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-xl">
          <div className="text-[10px] text-[#4ade80] font-semibold tracking-wider flex items-center justify-center gap-1">
            <span>↑</span> UP
          </div>
          <div className="text-base font-bold text-emerald-200 font-mono mt-0.5">
            {formatBytes(sessionTx)}
          </div>
        </div>
      </div>
    </div>
  );
}
