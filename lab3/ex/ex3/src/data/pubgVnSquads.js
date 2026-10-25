export const PUBG_VN_SQUADS = [
  {
    id: 'ces',
    name: 'Cerberus Esports',
    map: 'Erangel',
    phase: 'Phase 6',
    alive: 4,
    kills: 14,
    wwcdProb: '68%',
    status: 'In Safe Zone',
  },
  {
    id: 'te',
    name: 'The Expendables',
    map: 'Miramar',
    phase: 'Phase 7',
    alive: 4,
    kills: 18,
    wwcdProb: '82%',
    status: 'Holding High Ground',
  },
  {
    id: 'ge',
    name: 'Genius Esports',
    map: 'Taego',
    phase: 'Phase 5',
    alive: 3,
    kills: 9,
    wwcdProb: '41%',
    status: 'Rotating Blue Zone',
  },
];

const PACKET_LOSS_RATE = 0.35;

export function fetchMatchTelemetry(squadId, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const squad = PUBG_VN_SQUADS.find((item) => item.id === squadId);

    if (!squad) {
      reject(new Error('Squad telemetry not found.'));
      return;
    }

    const delay = 900;

    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Request aborted', 'AbortError'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);

      const shouldSimulatePacketLoss =
        (squad.map === 'Erangel' || squad.map === 'Miramar') &&
        Math.random() < PACKET_LOSS_RATE;

      if (shouldSimulatePacketLoss) {
        reject(new Error('Blue-Zone Link Lost: satellite packet timeout.'));
        return;
      }

      resolve({ ...squad });
    }, delay);
  });
}