/**
 * Runs `callback` on the next main-thread idle period, or at `timeout` at the
 * latest, and returns a cancel function.
 *
 * Ad work (injecting ads-785.js, creating the slots) pulls in the whole auction
 * stack — GPT, prebid, Confiant, Amazon, btloader — which measured ~1.7s of
 * script execution. Starting it the instant `load` fires lands all of that on
 * top of hydration. Idle-gating lets it slot into a gap instead, and the
 * timeout bounds how long a permanently busy page may hold up the first
 * impressions.
 *
 * Safari has no requestIdleCallback; there we fall back to a short timer, which
 * is not idle-aware but still yields to the current task.
 */
export const IDLE_FALLBACK_DELAY_MS = 200;

export function scheduleWhenIdle(
  callback: () => void,
  timeout: number
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = setTimeout(callback, IDLE_FALLBACK_DELAY_MS);
  return () => clearTimeout(handle);
}
