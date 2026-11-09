import { useEffect, useState } from 'react';

export function usePubgAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0,
) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs)),
  );

  useEffect(() => {
    const syncClock = () => {
      setRemainingMs(
        Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs)),
      );
    };

    syncClock();

    const timerId = window.setInterval(syncClock, 200);

    const onWake = () => {
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