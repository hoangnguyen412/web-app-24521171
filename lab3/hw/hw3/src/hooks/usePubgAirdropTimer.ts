
import { useEffect, useState } from 'react';

interface PubgAirdropTimerResult {
  readonly remainingMs: number;
  readonly isLive: boolean;
}

export function usePubgAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0,
): PubgAirdropTimerResult {
  const calcRemaining = (): number =>
    Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs));

  const [remainingMs, setRemainingMs] = useState(calcRemaining);

  useEffect(() => {
    const syncClock = (): void => {
      setRemainingMs(calcRemaining());
    };

    syncClock();

    const timerId = window.setInterval(syncClock, 200);

    const onWake = (): void => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };

    document.addEventListener('visibilitychange', onWake);

    return () => {
      window.clearInterval(timerId);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [targetEpochMs, serverOffsetMs]);

  return {
    remainingMs,
    isLive: remainingMs === 0,
  };
}
