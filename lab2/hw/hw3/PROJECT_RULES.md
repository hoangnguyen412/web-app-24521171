# PROJECT RULES — HW3: High-Concurrency Flash-Sale E-Commerce Engine

## 1. Domain and Scope

- Simulate a Vietnam Mega-Sale event inspired by Shopee/Lazada 11.11
  and midnight flash sales.
- This is an in-memory educational simulation, not a production
  distributed inventory system.
- Inventory updates and concurrency tests must follow the contracts
  defined in this document.

## 2. Architecture

- Use TypeScript for the implementation.
- Define contracts before implementing business logic.
- Keep inventory quantities in one authoritative inventory state.
- Do not maintain conflicting copies of stock in the UI.
- Separate timer logic, inventory logic, checkout logic, and UI logic.

## 3. Zero-Drift Countdown Timer

Required function signature:

    createAntiDriftTimer(
      durationMs: number,
      onTick: (remaining: number) => void
    ): () => void

Contract:

- `durationMs` is a finite, non-negative duration in milliseconds.
- Calculate `targetTime = Date.now() + durationMs` once.
- Calculate every remaining value using
  `Math.max(0, targetTime - Date.now())`.
- Use `requestAnimationFrame` to schedule updates.
- Never use `setInterval` or a decrementing counter for the countdown.
- Stop scheduling updates when the remaining time reaches zero.
- The returned cleanup function cancels future updates.
- The countdown calculation must recover correctly after a background
  tab is suspended.

Note: millisecond precision refers to the remaining-time calculation.
Actual visual updates depend on the browser's animation-frame schedule.

## 4. Inventory and Reservation State Model

Inventory quantities:

- `initialStock`: initial number of units.
- `available`: units that can still be reserved.
- `reserved`: units currently held by active reservations.
- `sold`: units successfully checked out.
- `version`: current inventory version, starting at zero.

Reservation statuses:

- `reserved`: the reservation holds stock until its expiry time.
- `checked_out`: checkout succeeded; this is a terminal status.
- `expired`: the reservation expired and its stock was released;
  this is a terminal status.

Business transitions:

    Available stock --reserve--> Reserved stock --checkout--> Sold stock
                                  |
                                  +--expiry--> Available stock

Reservation lifecycle:

    reserved --checkout--> checked_out
    reserved --expiry----> expired

An expired reservation cannot be checked out. A reservation can be
finalized or released only once.

## 5. Inventory Invariants

At all times:

- `available >= 0`
- `reserved >= 0`
- `sold >= 0`
- `available + reserved + sold === initialStock`
- All stock quantities are integers.
- Every reservation has a positive integer quantity.
- A reservation must not consume more stock than is available.
- Expiring a reservation releases its stock exactly once.
- Checkout moves reserved stock to sold stock exactly once.

## 6. Optimistic Inventory Lock

- Every inventory mutation receives an `expectedVersion`.
- Compare `expectedVersion` with the current inventory `version`
  before applying any mutation.
- Reject a stale version without changing inventory or reservation data.
- Recheck stock, reservation status, and expiry conditions immediately
  before applying a mutation.
- Every successful inventory mutation increments `version` once.
- A rejected mutation does not increment `version`.
- If checkout and expiry compete for the same reservation, only one
  transition may succeed.

The in-memory version lock demonstrates optimistic concurrency within
this simulation. It does not guarantee distributed locking across
multiple servers or processes.

## 7. AI Failure Mode Audit

The file `AI_FAILURE_AUDIT.md` is mandatory.

- Document at least three real defects found in AI-generated code.
- Each entry must include the location, problem, reproduction or test
  evidence, and fix.
- Do not report hypothetical defects as reproduced findings.
- Verify each finding before including it in the final audit.

## 8. Atomic Commits

- Create at least eight discrete commits.
- Follow Conventional Commits: `type(scope): subject`.
- Keep each commit focused on one coherent task.
- Do not use empty commits or combine unrelated tasks.
- Follow the required commit sequence in `TASK_DECOMPOSITION.md`.