// renderer/src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { useNetSpeed } from "./hooks/useNetSpeed";
import { Header } from "./components/Header";
import { SpeedHero } from "./components/SpeedHero";
import { SessionStats } from "./components/SessionStats";
import { SpeedTest } from "./components/SpeedTest";
import { Settings } from "./components/Settings";

export default function App() {
  const { isElectron, snapshot, history, updatePrefs, resetSession, platform } = useNetSpeed();
  const [isMaximized, setIsMaximized] = useState(false);

  const scrollContainerRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const lenis = new Lenis({
      wrapper: scrollContainerRef.current,
      content: scrollContainerRef.current.firstElementChild,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.1
    });
    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cardsContainerRef.current) return;
    const cards = cardsContainerRef.current.querySelectorAll(".anim-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 16, scale: 0.99 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: "power2.out", clearProps: "all" }
    );
  }, []);

  useEffect(() => {
    if (window.netspeed?.onMaximizedState) {
      const unsub = window.netspeed.onMaximizedState((maxState) => {
        setIsMaximized(maxState);
        setTimeout(() => lenisRef.current?.resize(), 250);
      });
      return () => unsub();
    }
  }, []);

  const handleMinimize = () => {
    if (window.netspeed?.minimizeWindow) window.netspeed.minimizeWindow();
  };

  const handleToggleMaximize = () => {
    if (window.netspeed?.toggleMaximizeWindow) window.netspeed.toggleMaximizeWindow();
  };

  const handleClose = () => {
    if (window.netspeed?.closeWindow) {
      window.netspeed.closeWindow();
    } else {
      window.close();
    }
  };

  if (!isElectron) {
    return (
      <div className="h-screen w-screen bg-[#11141c] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full clean-card rounded-2xl p-6 text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center text-lg font-bold">
            ⚡
          </div>
          <h2 className="text-sm font-semibold text-white mb-1">NetSpeed Desktop</h2>
          <p className="text-xs text-slate-400">Operating via background system tray process.</p>
        </div>
      </div>
    );
  }

  const inBits = Boolean(snapshot?.prefs?.bits);
  const isPackaged = Boolean(snapshot?.packaged);
  const isWindows = platform === "win32";

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f121a] text-slate-100 select-none overflow-hidden font-sans">
      {/* 
        Sticky Native Titlebar: Locked permanently at top
      */}
      <header
        className="flex items-center justify-between px-4 h-10 border-b border-white/[0.08] bg-[#141822]/95 backdrop-blur-md select-none shrink-0 z-50 sticky top-0"
        style={{ WebkitAppRegion: "drag" }}
        onDoubleClick={handleToggleMaximize}
      >
        {isWindows ? (
          <>
            <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" }}>
              <img src="./tray-icon.png" alt="NetSpeed" className="w-4 h-4 object-contain" />
              <span className="text-xs font-semibold text-slate-200 tracking-tight">NetSpeed Dashboard</span>
            </div>

            <div className="flex items-center h-full -mr-4" style={{ WebkitAppRegion: "no-drag" }}>
              <button
                type="button"
                onClick={handleMinimize}
                className="w-11 h-10 flex items-center justify-center hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                title="Minimize"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor">
                  <rect y="5.5" width="12" height="1" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleToggleMaximize}
                className="w-11 h-10 flex items-center justify-center hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                    <rect x="1.5" y="3.5" width="7" height="7" strokeWidth="1" />
                    <polyline points="3.5,3.5 3.5,1.5 10.5,1.5 10.5,8.5 8.5,8.5" strokeWidth="1" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                    <rect x="1.5" y="1.5" width="9" height="9" strokeWidth="1" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-11 h-10 flex items-center justify-center hover:bg-[#e81123] text-slate-300 hover:text-white transition-colors"
                title="Close to Tray"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor">
                  <polygon points="11,1.7 10.3,1 6,5.3 1.7,1 1,1.7 5.3,6 1,10.3 1.7,11 6,6.7 10.3,11 11,10.3 6.7,6" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" }}>
              <button
                type="button"
                onClick={handleClose}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 border border-[#e0443e] transition-all"
                title="Close to tray"
              ></button>
              <button
                type="button"
                onClick={handleMinimize}
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 border border-[#dea123] transition-all"
                title="Minimize"
              ></button>
              <button
                type="button"
                onClick={handleToggleMaximize}
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 border border-[#1aab29] transition-all"
                title="Zoom"
              ></button>
            </div>

            <div className="flex items-center gap-2">
              <img src="./tray-icon.png" alt="NetSpeed" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[12px] font-medium text-slate-300 font-sans tracking-wide">
                NetSpeed Dashboard
              </span>
            </div>

            <div className="w-12"></div>
          </>
        )}
      </header>

      {/* 
        Responsive Adaptive Scroll Container:
        Expands gracefully to full screen with balanced multi-column grid, no empty voids.
      */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 pt-5 pb-14 flex justify-center">
        <div ref={cardsContainerRef} className="w-full max-w-[1200px] flex flex-col gap-4">
          {/* Header Info */}
          <div className="anim-card">
            <Header snapshot={snapshot} />
          </div>

          {/* Full Screen Adaptive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Speed Hero: Takes full width on small/medium, 7 cols on large full screen */}
            <div className="anim-card lg:col-span-7 flex flex-col">
              <SpeedHero
                rx={snapshot?.rx || 0}
                tx={snapshot?.tx || 0}
                inBits={inBits}
                history={history}
              />
            </div>

            {/* Right Column on full screen: Session Stats + Benchmark (Takes 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="anim-card flex-1 flex flex-col">
                <SessionStats
                  sessionRx={snapshot?.sessionRx || 0}
                  sessionTx={snapshot?.sessionTx || 0}
                  sessionStart={snapshot?.sessionStart}
                  onReset={resetSession}
                />
              </div>

              <div className="anim-card flex-1 flex flex-col">
                <SpeedTest inBits={inBits} />
              </div>
            </div>
          </div>

          {/* Settings Section: Full width clean card at bottom */}
          <div className="anim-card">
            <Settings
              prefs={snapshot?.prefs}
              onUpdatePrefs={updatePrefs}
              isPackaged={isPackaged}
            />
          </div>

          {/* Solid Bottom Spacer to guarantee generous bottom margin after scroll */}
          <div className="w-full h-8 shrink-0 select-none pointer-events-none" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
