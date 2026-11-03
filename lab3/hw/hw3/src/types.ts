export type DropPhase =
  | 'WARMUP'
  | 'AIRDROP_LIVE'
  | 'LOOTED_OUT'
  | 'EXPIRED';

export interface PubgCrateDrop {
  readonly id: string;
  readonly title: string;
  readonly priceVnd: number;
  readonly remainingStock: number;
  readonly dropEpochMs: number;
}

export interface PubgVnSquadStanding {
  readonly squadId: 'te' | 'ces' | 'ge' | 'agg';
  readonly squadName: string;
  readonly wwcdCount: number;
  readonly placementPts: number;
  readonly killPts: number;
}