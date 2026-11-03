import type { PubgCrateDrop } from '../types';

const pageLoadedAt = Date.now();

export const drops: readonly PubgCrateDrop[] = [
  {
    id: 'drop-vip-ticket',
    title: 'PVS Grand Finals VIP Ticket',
    priceVnd: 1_500_000,
    remainingStock: 3,
    dropEpochMs: pageLoadedAt + 20_000,
  },
  {
    id: 'drop-gcoin-crate',
    title: 'G-Coin Contraband Crate',
    priceVnd: 200_000,
    remainingStock: 2,
    dropEpochMs: pageLoadedAt + 40_000,
  },
];