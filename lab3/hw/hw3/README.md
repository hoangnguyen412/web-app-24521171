# HW3 — KRAFTON x PUBG Vietnam Championship & Airdrop Arena

A React 19 esports page for the **PUBG Vietnam Series (PVS) Finals Ticket & G-Coin Contraband Crate Arena**. It evolves the Lab 2 HW 3 `createAntiDriftTimer` (and the Slide 22 virtual list idea) into three features: a zero-drift airdrop countdown hook, an optimistic claim flow with 409 rollback, and a PUBG VN leaderboard.

The homework focuses on timers that never drift in background tabs, idempotent optimistic inventory updates, immutable domain types and derived state without `useEffect`.

## Homework Scope

Build the arena around the assignment's domain contract:

```ts
export type DropPhase = 'WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED';

export interface PubgCrateDrop {
  readonly id: string;
  readonly title: string;
  readonly priceVnd: number;
  readonly remainingStock: number;
  readonly dropEpochMs: number;
}

export interface PubgVnSquadStanding {
  readonly squadId: string;   // 'te' | 'ces' | 'ge' | 'agg'
  readonly squadName: string;
  readonly wwcdCount: number;
  readonly placementPts: number;
  readonly killPts: number;
}
```

The sample data below is an implementation decision, because the assignment fixes the types and squad names but not the numbers.

| Squad | `squadId` | Note |
| --- | --- | --- |
| The Expendables | `te` | |
| Cerberus Esports | `ces` | |
| Roy Esports | `ge` | `ge` is the id given in the assignment's union |
| AGG | `agg` | |

## Required Behavior

### 1. Zero-Drift Airdrop Countdown

- `usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0)` returns `{ remainingMs, isLive }`.
- Remaining time is `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`, never a per-second decrement.
- The clock is recomputed every 200 ms, immediately on mount, and immediately on `visibilitychange` when the tab becomes visible.
- The interval and listener are removed in cleanup.

### 2. Optimistic Claim & 409 Rollback

- Players can claim PVS Grand Finals VIP Tickets and G-Coin Crates.
- Prices are shown in VND with `Intl.NumberFormat('vi-VN')`.
- Stock is deducted in the UI immediately (optimistic update).
- An in-flight lock with a `claimId` prevents duplicate claims and duplicate clicks.
- On HTTP `409 Conflict` ("Looted Out") the stock is rolled back to the correct value.
- The lock is always released when the request finishes.

### 3. Live PUBG VN Leaderboard

- Shows The Expendables, Cerberus Esports, Roy Esports and AGG.
- Filters by squad name and sorts by WWCD, Placement Points or Kill Points.

### Deliverable

- `AI_AUDIT.md` (submit as `AI_FAILURE_AUDIT.md`) with at least 3 real AI bugs, worth 15%.

## Technology and Requirements

- React 19 function components and hooks.
- Vite with the React + TypeScript template; plain CSS.
- No extra dependencies.
- An in-app mock server for claims (no real backend).
- `AbortController` for the mock request.
- Semantic HTML: `main`, `section`, `table`, `label`, `input`, `select`, `button`.

## Architecture Notes

- **Target-epoch timer:** the countdown derives from the wall clock, so background throttling cannot cause drift.
- **Phase is derived:** `DropPhase` is computed from `remainingMs` and stock during render, never stored.
- **Two-layer lock:** a `useRef` set blocks double clicks synchronously; React state mirrors it so buttons render disabled.
- **Exact rollback:** a failed claim gives back exactly the amount it deducted, so concurrent claims do not corrupt stock.
- **Immutability:** domain objects are `readonly` and replaced with new objects on update.
- **Derived leaderboard:** filtering and sorting happen during render with `toSorted()`.

## Getting Started

```bash
npm install
npm run dev
```

Before submitting:

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  types.ts                         # domain contract
  hooks/
    usePubgAirdropTimer.ts         # zero-drift countdown
    useOptimisticClaim.ts          # lock + optimistic stock + rollback
  api/
    mockServer.ts                  # mock claim endpoint with 409
  data/
    drops.ts
    standings.ts
  lib/
    formatVnd.ts
  components/
    DropCard.tsx
    Leaderboard.tsx
  App.tsx
  main.tsx
  index.css
```

## Verification Checklist

- [ ] `types.ts` matches the assignment's domain contract, including `readonly`.
- [ ] The countdown is correct after the tab was in the background for over a minute.
- [ ] The countdown reaches `0` and never goes negative.
- [ ] The interval and `visibilitychange` listener are removed on unmount.
- [ ] Prices render in `vi-VN` VND format.
- [ ] A claim lowers the displayed stock immediately.
- [ ] A double-click sends exactly one request (Network or Console log).
- [ ] A `409` response restores stock to the exact previous value and shows "Looted Out".
- [ ] The claim lock is released after success and after failure.
- [ ] The leaderboard filters by squad name and sorts by WWCD, Placement Points and Kill Points.
- [ ] Filtering and sorting use no `useEffect`.
- [ ] No console errors or React warnings.

## Verification Audit

```bash
# No setSeconds-style countdown (expected: 0 matches)
grep -rn "s - 1" src/

# visibilitychange resync is present (expected: at least 1 match)
grep -n "visibilitychange" src/hooks/usePubgAirdropTimer.ts

# Interval cleanup is present (expected: at least 1 match)
grep -n "clearInterval" src/hooks/usePubgAirdropTimer.ts

# VND formatting uses Intl (expected: at least 1 match)
grep -rn "Intl.NumberFormat" src/

# Leaderboard does not derive state in an effect (expected: 0 matches)
grep -n "useEffect" src/components/Leaderboard.tsx
```

## Related Documents

- `TASK_DECOMPOSITION.md`
- `PROJECT_RULES.md`
- `AI_AUDIT.md` (rename to `AI_FAILURE_AUDIT.md` when submitting)
