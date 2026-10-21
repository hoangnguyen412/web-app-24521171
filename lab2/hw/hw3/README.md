# HW3: High-Concurrency Flash-Sale E-Commerce Engine

A Vietnam Mega-Sale simulation inspired by Shopee/Lazada 11.11 and
midnight flash sales.

## Features

- **Zero-Drift Timer:** Calculates the remaining time using the
  `Date.now()` delta instead of decrementing a counter.
- **Inventory State Machine:** Handles reservation, lock expiry,
  and checkout.
- **Optimistic Inventory Lock:** Rejects stale updates using `version`.
- **Concurrency Verification:** Tests competing buyers and stock invariants.
- **AI Failure Mode Audit:** Documents at least three verified defects
  found in AI-generated code.
- **Atomic Commits:** At least eight Conventional Commits.

## Timer Contract

Required signature:

```ts
export function createAntiDriftTimer(
  durationMs: number,
  onTick: (remaining: number) => void
): () => void;
```

Contract:

- Calculate `targetTime = Date.now() + durationMs` once.
- Calculate `remaining = Math.max(0, targetTime - Date.now())` on each tick.
- Schedule updates using `requestAnimationFrame`.
- Do not use `setInterval` or decrement a counter.
- Stop scheduling updates at zero.
- Return a cleanup function that cancels future updates.

The remaining-time calculation avoids accumulated countdown drift.
Visual refresh frequency is controlled by the browser.

## Inventory State Machine

Stock transitions:

```text
Available stock --reserve--> Reserved stock --checkout--> Sold stock
                              |
                              +--lock expiry--> Available stock
```

Reservation lifecycle:

```text
reserved --checkout--> checked_out
reserved --expiry----> expired
```

An expired reservation releases its stock exactly once. It cannot be
checked out. Inventory updates require the current expected `version`;
a stale version is rejected without changing state.

## Inventory Invariants

At all times:

```text
available >= 0
reserved >= 0
sold >= 0
available + reserved + sold === initialStock
```

Successful inventory mutations increment `version` once. Failed mutations
must not change the inventory state or increment the version.

## Project Structure

```text
hw3-flash-sale/
├── index.html
├── anti-drift-timer.ts
├── inventory.ts
├── checkout.ts
├── AI_FAILURE_AUDIT.md
├── PROJECT_RULES.md
├── TASK_DECOMPOSITION.md
└── README.md
```

## Verification Checklist

- [ ] Timer uses `Date.now()` and `requestAnimationFrame`.
- [ ] No `setInterval` or decrementing countdown counter.
- [ ] Timer stops at zero and supports cancellation.
- [ ] Reservation and stock transitions are valid.
- [ ] Stock never becomes negative.
- [ ] Stale inventory versions are rejected.
- [ ] Expired reservations cannot be checked out.
- [ ] A reservation is released or checked out at most once.
- [ ] Competing buyers cannot oversell stock.
- [ ] `AI_FAILURE_AUDIT.md` documents at least three verified defects.
- [ ] Git history contains at least eight Conventional Commits.
- [ ] No browser console errors.

## Git History

Follow the eight-commit sequence in `TASK_DECOMPOSITION.md`.
Each commit must represent one coherent task.