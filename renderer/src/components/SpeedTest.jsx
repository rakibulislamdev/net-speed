// renderer/src/components/SpeedTest.jsx
import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

const TEST_SERVERS = [
  {
    name: "Primary CDN",
    downloadUrl: "https://speed.cloudflare.com/__down?bytes=15000000",
    uploadUrl: "https://speed.cloudflare.com/__up"
  },
  {
    name: "Backup CDN",
    downloadUrl: "https://proof.ovh.net/files/10Mb.dat",
    uploadUrl: "https://httpbin.org/post"
  }
];

export function SpeedTest({ inBits }) {
  const [phase, setPhase] = useState("idle");
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [downloadResult, setDownloadResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const progressBarRef = useRef(null);
  const speedTextRef = useRef(null);
  const statusBannerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const tweenRef = useRef(null);

  useEffect(() => {
    if (window.netspeed?.onAutoStartSpeedTest) {
      const unsub = window.netspeed.onAutoStartSpeedTest(() => {
        startSpeedTest();
      });
      return () => unsub();
    }
  }, []);

  // GSAP: Animate Progress Bar fluidly during download / upload
  useEffect(() => {
    if (phase === "download") {
      if (statusBannerRef.current) {
        gsap.fromTo(statusBannerRef.current, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
      }
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
        // Fluidly animate up to 50% during download phase (~7s)
        tweenRef.current = gsap.fromTo(
          progressBarRef.current,
          { width: "2%" },
          { width: "50%", duration: 7, ease: "power1.inOut" }
        );
      }
    } else if (phase === "upload") {
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
        // Continue fluidly from 50% to 98% during upload phase (~4s)
        tweenRef.current = gsap.to(progressBarRef.current, {
          width: "98%",
          duration: 4.5,
          ease: "power2.out"
        });
      }
    } else if (phase === "done") {
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          width: "100%",
          duration: 0.3,
          ease: "power2.out"
        });
      }
    }
  }, [phase]);

  const formatResult = (bytesPerSec) => {
    if (bytesPerSec == null) return "--";
    const bytes = Math.max(0, bytesPerSec);
    if (inBits) {
      const mbps = (bytes * 8) / (1000 * 1000);
      return `${mbps.toFixed(1)} Mbps`;
    }
    const mbps = bytes / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  const startSpeedTest = async () => {
    if (phase === "download" || phase === "upload") return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setPhase("download");
    setCurrentSpeed(0);
    setDownloadResult(null);
    setUploadResult(null);
    setErrorMessage("");

    let success = false;

    for (const server of TEST_SERVERS) {
      if (ac.signal.aborted) break;

      try {
        const downStart = performance.now();
        let loadedBytes = 0;

        const response = await fetch(server.downloadUrl, {
          signal: ac.signal,
          cache: "no-store"
        });

        if (!response.ok || !response.body) {
          continue;
        }

        const reader = response.body.getReader();
        const maxDurationMs = 7000;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          loadedBytes += value.byteLength;
          const elapsed = (performance.now() - downStart) / 1000;
          if (elapsed > 0.2) {
            setCurrentSpeed(loadedBytes / elapsed);
          }

          if (performance.now() - downStart >= maxDurationMs) {
            await reader.cancel();
            break;
          }
        }

        const totalDownSec = (performance.now() - downStart) / 1000;
        setDownloadResult(loadedBytes / Math.max(0.1, totalDownSec));

        // Upload phase
        setPhase("upload");
        setCurrentSpeed(0);

        const upStart = performance.now();
        const uploadBytes = 4 * 1024 * 1024;
        const dummyData = new Uint8Array(uploadBytes);

        try {
          await fetch(server.uploadUrl, {
            method: "POST",
            body: dummyData,
            signal: ac.signal,
            cache: "no-store",
            headers: { "Content-Type": "application/octet-stream" }
          });
        } catch {
          // Ignore
        }

        const totalUpSec = (performance.now() - upStart) / 1000;
        setUploadResult(uploadBytes / Math.max(0.1, totalUpSec));
        setPhase("done");
        success = true;
        break;
      } catch (err) {
        if (err.name === "AbortError") {
          setPhase("idle");
          return;
        }
      }
    }

    if (!success && !ac.signal.aborted) {
      setPhase("error");
      setErrorMessage("Could not connect to speed test servers.");
    }
  };

  const cancelTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    gsap.killTweensOf(progressBarRef.current);
    setPhase("idle");
    setCurrentSpeed(0);
  };

  return (
    <div className="clean-card rounded-2xl p-4 flex flex-col justify-between h-full gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Speed Benchmark
        </span>

        {phase === "idle" || phase === "done" || phase === "error" ? (
          <button
            type="button"
            onClick={startSpeedTest}
            className="clean-button text-xs font-medium text-slate-200 hover:text-white px-3 py-1 rounded-lg"
          >
            <span>{phase === "done" ? "Test Again" : "Start Test"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelTest}
            className="clean-button text-xs font-medium text-rose-300 hover:text-rose-200 px-3 py-1 rounded-lg border-rose-500/20"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Speed Benchmark Result Grid - Clean Crisp Border, No blurry shadows */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* DOWNLOAD BOX */}
        <div className="p-[1px] rounded-xl relative overflow-hidden">
          {/* Animated 4-side rotating gradient beam when testing download */}
          {phase === "download" ? (
            <div className="beam-border-download pointer-events-none" />
          ) : (
            <div className="absolute inset-0 bg-white/[0.06] rounded-xl pointer-events-none" />
          )}

          <div className="bg-[#151924] p-3 rounded-[11px] relative z-10 flex flex-col justify-center h-full">
            <div className="text-[11px] text-[#38bdf8] font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>↓</span> DOWNLOAD
              </span>
              {phase === "download" && (
                <span className="text-[10px] text-sky-400 font-mono animate-pulse">TESTING</span>
              )}
            </div>
            <div className="text-base font-bold text-white font-mono mt-1 tabular-nums">
              {phase === "download" ? formatResult(currentSpeed) : formatResult(downloadResult)}
            </div>
          </div>
        </div>

        {/* UPLOAD BOX */}
        <div className="p-[1px] rounded-xl relative overflow-hidden">
          {/* Animated 4-side rotating gradient beam when testing upload */}
          {phase === "upload" ? (
            <div className="beam-border-upload pointer-events-none" />
          ) : (
            <div className="absolute inset-0 bg-white/[0.06] rounded-xl pointer-events-none" />
          )}

          <div className="bg-[#151924] p-3 rounded-[11px] relative z-10 flex flex-col justify-center h-full">
            <div className="text-[11px] text-[#4ade80] font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>↑</span> UPLOAD
              </span>
              {phase === "upload" && (
                <span className="text-[10px] text-emerald-400 font-mono animate-pulse">TESTING</span>
              )}
            </div>
            <div className="text-base font-bold text-white font-mono mt-1 tabular-nums">
              {phase === "upload" ? formatResult(currentSpeed) : formatResult(uploadResult)}
            </div>
          </div>
        </div>
      </div>

      {phase === "error" && (
        <div className="bg-rose-950/20 border border-rose-500/20 p-2 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button type="button" onClick={startSpeedTest} className="text-[11px] underline text-rose-200">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
