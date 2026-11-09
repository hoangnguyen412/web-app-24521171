import type { DropPhase, PubgCrateDrop } from '../types';
import { usePubgAirdropTimer } from '../hooks/usePubgAirdropTimer';
import { formatVnd } from '../lib/formatVnd';
import { formatCountdown } from '../lib/formatCountdown';

interface DropCardProps {
  readonly drop: PubgCrateDrop;
  readonly isClaiming: boolean;
  readonly claimStatus: string;
  readonly onClaim: (
    dropId: string,
    canClaim: boolean,
  ) => void | Promise<void>;
}

function getDropPhase(
  remainingMs: number,
  remainingStock: number,
): DropPhase {
  if (remainingStock <= 0) {
    return 'LOOTED_OUT';
  }

  if (remainingMs > 0) {
    return 'WARMUP';
  }

  return 'AIRDROP_LIVE';
}

export function DropCard({
  drop,
  isClaiming,
  claimStatus,
  onClaim,
}: DropCardProps) {
  const { remainingMs } = usePubgAirdropTimer(drop.dropEpochMs);

  // Derived state: calculate phase during render.
  const phase = getDropPhase(remainingMs, drop.remainingStock);

  const canClaim = phase === 'AIRDROP_LIVE' && !isClaiming;

  const statusBelongsToDrop = claimStatus.includes(drop.title);

  return (
    <article className="drop-card">
      <div className="drop-card__header">
        <span className="drop-card__label">
          PUBG VIETNAM AIRDROP
        </span>

        <span
          className={`drop-card__phase drop-card__phase--${phase.toLowerCase()}`}
        >
          {phase.replaceAll('_', ' ')}
        </span>
      </div>

      <h3 className="drop-card__title">{drop.title}</h3>

      <p className="drop-card__price">
        {formatVnd(drop.priceVnd)}
      </p>

      <div className="drop-card__details">
        <div>
          <span>Remaining Stock</span>
          <strong>{drop.remainingStock}</strong>
        </div>

        <div>
          <span>Drop Countdown</span>
          <strong className="drop-card__timer">
            {formatCountdown(remainingMs)}
          </strong>
        </div>
      </div>

      <button
        type="button"
        className="drop-card__button"
        disabled={!canClaim}
        onClick={() => void onClaim(drop.id, canClaim)}
      >
        {isClaiming
          ? 'CLAIMING...'
          : phase === 'WARMUP'
            ? 'WAIT FOR AIRDROP'
            : phase === 'LOOTED_OUT'
              ? 'LOOTED OUT'
              : 'CLAIM REWARD'}
      </button>

      {statusBelongsToDrop && (
        <p className="drop-card__status" role="status">
          {claimStatus}
        </p>
      )}
    </article>
  );
}