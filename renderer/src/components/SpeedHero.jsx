// renderer/src/components/SpeedHero.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";

function formatRate(bytesPerSec, inBits) {
  const safeBytes = Math.max(0, Number(bytesPerSec) || 0);
  if (inBits) {
    const bits = safeBytes * 8;
    if (bits < 1000) return { value: Math.round(bits), unit: "bps" };
    if (bits < 1000 * 1000) return { value: (bits / 1000).toFixed(1), unit: "Kbps" };
    if (bits < 1000 * 1000 * 1000) return { value: (bits / (1000 * 1000)).toFixed(1), unit: "Mbps" };
    return { value: (bits / (1000 * 1000 * 1000)).toFixed(2), unit: "Gbps" };
  }

  if (safeBytes < 1024) return { value: Math.round(safeBytes), unit: "B/s" };
  if (safeBytes < 1024 * 1024) return { value: (safeBytes / 1024).toFixed(1), unit: "KB/s" };
  if (safeBytes < 1024 * 1024 * 1024) return { value: (safeBytes / (1024 * 1024)).toFixed(1), unit: "MB/s" };
  return { value: (safeBytes / (1024 * 1024 * 1024)).toFixed(2), unit: "GB/s" };
}

export function SpeedHero({ rx, tx, inBits, history }) {
  const down = formatRate(rx, inBits);
  const up = formatRate(tx, inBits);

  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(500);
  const chartHeight = 90;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 50) {
          setChartWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { downPath, upPath, downArea, upArea, maxScaleFormatted } = useMemo(() => {
    const pointsCount = 60;
    const filledHistory = [...Array(Math.max(0, pointsCount - history.length)).fill({ rx: 0, tx: 0 }), ...history];

    const minScale = inBits ? 1000 * 1000 : 1024 * 1024;
    let maxVal = minScale;

    filledHistory.forEach((pt) => {
      const r = inBits ? pt.rx * 8 : pt.rx;
      const t = inBits ? pt.tx * 8 : pt.tx;
      if (r > maxVal) maxVal = r;
      if (t > maxVal) maxVal = t;
    });

    const stepX = chartWidth / (pointsCount - 1);
    const downPoints = [];
    const upPoints = [];

    filledHistory.forEach((pt, i) => {
      const x = i * stepX;
      const rVal = inBits ? pt.rx * 8 : pt.rx;
      const tVal = inBits ? pt.tx * 8 : pt.tx;

      const yDown = chartHeight - (rVal / maxVal) * (chartHeight - 12) - 4;
      const yUp = chartHeight - (tVal / maxVal) * (chartHeight - 12) - 4;

      downPoints.push(`${x.toFixed(1)},${yDown.toFixed(1)}`);
      upPoints.push(`${x.toFixed(1)},${yUp.toFixed(1)}`);
    });

    const dPath = "M " + downPoints.join(" L ");
    const uPath = "M " + upPoints.join(" L ");

    const dArea = `${dPath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    const uArea = `${uPath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

    const scaleFormatted = formatRate(inBits ? maxVal / 8 : maxVal, inBits);

    return {
      downPath: dPath,
      upPath: uPath,
      downArea: dArea,
      upArea: uArea,
      maxScaleFormatted: `${scaleFormatted.value} ${scaleFormatted.unit}`
    };
  }, [history, inBits, chartWidth]);

  return (
    <div className="clean-card rounded-2xl p-4 flex flex-col justify-between h-full gap-3">
      {/* 2 Stat Cards formatted with Apple/Windows HIG Typography */}
      <div className="grid grid-cols-2 gap-3">
        {/* Download Box */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-[#38bdf8]">
              <span className="text-sm font-bold">↓</span>
              <span className="tracking-wide text-[11px]">DOWNLOAD</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">LIVE</span>
          </div>
          {/* Matching Speed Benchmark font: font-mono text-base font-bold text-white */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-white font-mono tabular-nums leading-none">
              {down.value} {down.unit}
            </span>
          </div>
        </div>

        {/* Upload Box */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-[#4ade80]">
              <span className="text-sm font-bold">↑</span>
              <span className="tracking-wide text-[11px]">UPLOAD</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">LIVE</span>
          </div>
          {/* Matching Speed Benchmark font: font-mono text-base font-bold text-white */}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-white font-mono tabular-nums leading-none">
              {up.value} {up.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Fluid Activity Graph */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 font-medium">
          <span className="text-slate-300">Live Activity (60s)</span>
          <span className="font-mono text-[10px]">Peak: {maxScaleFormatted}</span>
        </div>

        <div ref={containerRef} className="w-full bg-black/30 border border-white/[0.05] rounded-xl p-3 overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-20 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1="0" y1="18" x2={chartWidth} y2="18" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="0" y1="52" x2={chartWidth} y2="52" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" strokeWidth="1" />

            <path d={downArea} fill="url(#downGrad)" />
            <path d={downPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            <path d={upArea} fill="url(#upGrad)" />
            <path d={upPath} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="flex items-center justify-end gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-[#38bdf8]">
              <span className="font-bold">↓</span>
              <span>Download</span>
            </span>
            <span className="flex items-center gap-1 text-[#4ade80]">
              <span className="font-bold">↑</span>
              <span>Upload</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
