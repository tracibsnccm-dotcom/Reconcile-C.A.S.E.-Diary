// src/lib/deployEnv.ts
/**
 * Staging/preview detection with ZERO reliance on backend state.
 * Goal: make it impossible to confuse preview/staging with production.
 *
 * Rules:
 * - Show STAGING badge on:
 *   - Vercel preview deployments (*.vercel.app)
 *   - any hostname containing "staging"
 *   - local dev (localhost / 127.0.0.1)
 * - Never show on production custom domain(s)
 *
 * Note:
 * - We intentionally avoid relying on process/env injection that may differ
 *   across Vercel/Vite configs. Hostname-based detection is deterministic.
 */

export function getHostname(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname || "";
}

export function isLocalhost(hostname = getHostname()): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function isVercelPreview(hostname = getHostname()): boolean {
  // Vercel preview deployments typically use *.vercel.app
  return hostname.endsWith(".vercel.app");
}

export function isStagingHost(hostname = getHostname()): boolean {
  // Covers custom staging domains like staging.example.com
  return hostname.toLowerCase().includes("staging");
}

/**
 * True when we should display staging-only UI.
 */
export function isStagingLikeEnvironment(hostname = getHostname()): boolean {
  return isLocalhost(hostname) || isVercelPreview(hostname) || isStagingHost(hostname);
}
