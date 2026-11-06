// renderer/src/hooks/useNetSpeed.js
import { useState, useEffect, useRef } from "react";

export function useNetSpeed() {
  const [isElectron, setIsElectron] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]); // Array of { rx, tx, timestamp } (max 60)
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!window.netspeed) {
      setIsElectron(false);
      return;
    }

    // 1. Fetch initial snapshot
    window.netspeed
      .getSnapshot()
      .then((data) => {
        if (!isMountedRef.current) return;
        setSnapshot(data);
        if (data) {
          setHistory([{ rx: data.rx, tx: data.tx, timestamp: data.timestamp }]);
        }
      })
      .catch(() => {});

    // 2. Listen to 1-second live stream from main process
    const unsubscribe = window.netspeed.onStats((freshData) => {
      if (!isMountedRef.current) return;
      setSnapshot(freshData);
      setHistory((prev) => {
        const next = [...prev, { rx: freshData.rx, tx: freshData.tx, timestamp: freshData.timestamp }];
        if (next.length > 60) {
          return next.slice(next.length - 60);
        }
        return next;
      });
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const updatePrefs = async (patch) => {
    if (!window.netspeed) return;
    try {
      const updated = await window.netspeed.setPrefs(patch);
      setSnapshot(updated);
    } catch {
      // Ignore
    }
  };

  const resetSession = async () => {
    if (!window.netspeed) return;
    try {
      const updated = await window.netspeed.resetSession();
      setSnapshot(updated);
      setHistory([]);
    } catch {
      // Ignore
    }
  };

  return {
    isElectron,
    snapshot,
    history,
    updatePrefs,
    resetSession,
    platform: window.netspeed?.platform || "unknown"
  };
}

