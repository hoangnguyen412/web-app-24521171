export function createAntiDriftTimer(durationMs, onTick) {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
        throw new RangeError("durationMs must be finite and non-negative");
    }
    // Calculate the deadline exactly once.
    const targetTime = Date.now() + durationMs;
    let rafId = null;
    let cancelled = false;
    function tick() {
        if (cancelled)
            return;
        // This animation frame has started; it is no longer pending.
        rafId = null;
        const remaining = Math.max(0, targetTime - Date.now());
        onTick(remaining);
        if (!cancelled && remaining > 0) {
            rafId = requestAnimationFrame(tick);
        }
    }
    rafId = requestAnimationFrame(tick);
    return function cancel() {
        if (cancelled)
            return;
        cancelled = true;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };
}
