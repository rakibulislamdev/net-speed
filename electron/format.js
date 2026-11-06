// electron/format.js
// Utility functions for human-readable rate and byte formatting.

/**
 * Format bytes per second into full rate string.
 * @param {number} bytesPerSec
 * @param {boolean} inBits - If true, calculate in bits (decimal 1000 base), else bytes (binary 1024 base).
 * @returns {string} e.g. "2.5 MB/s" or "20.0 Mbps"
 */
function formatSpeed(bytesPerSec, inBits = false) {
  const safeBytes = Math.max(0, Number(bytesPerSec) || 0);

  if (inBits) {
    const bits = safeBytes * 8;
    if (bits < 1000) return `${Math.round(bits)} bps`;
    if (bits < 1000 * 1000) return `${(bits / 1000).toFixed(1)} Kbps`;
    if (bits < 1000 * 1000 * 1000) return `${(bits / (1000 * 1000)).toFixed(1)} Mbps`;
    return `${(bits / (1000 * 1000 * 1000)).toFixed(2)} Gbps`;
  }

  if (safeBytes < 1024) return `${Math.round(safeBytes)} B/s`;
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB/s`;
  if (safeBytes < 1024 * 1024 * 1024) return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB/s`;
  return `${(safeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
}

/**
 * Format speed into compact representation of at most 4 characters for Windows tray icon.
 * Examples: "0K", "1.5M", "999K", "12M", "1.2G"
 * @param {number} bytesPerSec
 * @param {boolean} inBits
 * @returns {string} Max 4 characters
 */
function formatCompactSpeed(bytesPerSec, inBits = false) {
  const safeBytes = Math.max(0, Number(bytesPerSec) || 0);
  const factor = inBits ? 1000 : 1024;
  const value = inBits ? safeBytes * 8 : safeBytes;

  // If traffic is virtually 0, show clean "0" or "0B" instead of "0K" (which looks like "OK")
  if (value < factor) {
    if (value === 0) return "0";
    return inBits ? `${Math.round(value)}b` : `${Math.round(value)}B`;
  }

  const kVal = value / factor;
  if (kVal < 10) return `${kVal.toFixed(1)}K`; // e.g. 2.5K
  if (kVal < 999.5) return `${Math.round(kVal)}K`; // e.g. 54K, 850K

  const mVal = kVal / factor;
  if (mVal < 10) return `${mVal.toFixed(1)}M`; // e.g. 3.2M
  if (mVal < 999.5) return `${Math.round(mVal)}M`; // e.g. 45M

  const gVal = mVal / factor;
  if (gVal < 10) return `${gVal.toFixed(1)}G`; // e.g. 1.2G
  return `${Math.round(gVal)}G`;
}

/**
 * Format total bytes accumulated.
 * Below 1 GB: in MB with 1 decimal. Above 1 GB: in GB with 2 decimals.
 * @param {number} bytes
 * @returns {string}
 */
function formatTotalBytes(bytes) {
  const safeBytes = Math.max(0, Number(bytes) || 0);
  const oneMB = 1024 * 1024;
  const oneGB = 1024 * 1024 * 1024;

  if (safeBytes < oneGB) {
    return `${(safeBytes / oneMB).toFixed(1)} MB`;
  }
  return `${(safeBytes / oneGB).toFixed(2)} GB`;
}

/**
 * Format elapsed duration from milliseconds into human readable string.
 * @param {number} ms
 * @returns {string} e.g. "1h 24m 10s"
 */
function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

module.exports = {
  formatSpeed,
  formatCompactSpeed,
  formatTotalBytes,
  formatDuration
};

