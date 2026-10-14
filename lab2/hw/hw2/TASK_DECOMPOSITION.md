# TASK DECOMPOSITION — HW2: Concurrent FIFO Audio Visualizer Queue Engine

## T-01 — Queue Contract & WBS
- **Objective**: Freeze the public API before any implementation.
- **Tasks**: Define `AudioTask` and `AudioTaskQueue` in `audio-queue-controller.ts` (`queue`, `isProcessing`, `activeController`, `enqueue(trackUrl: string): Promise<AudioBuffer>`). Write `PROJECT_RULES.md`, `TASK_DECOMPOSITION.md`, `README.md`.
- **Contract**: Types and signatures only; zero logic.
- **Verification**: The contract compiles and matches the specification.
- **Atomic Commit**: `docs(spec): define queue contract & WBS table`

## T-02 — FIFO Queue Controller
- **Objective**: Process tasks strictly in enqueue order.
- **Tasks**: Implement `enqueue()` (one `AbortController` per task) and `processNext()` with the `isProcessing` guard; settle each task's own promise.
- **Contract**: One task is processed at a time; a failed or cancelled task does not block the queue.
- **Verification**: Enqueue several tasks at once with a mock loader: processed in order; one failing task, the rest still run.
- **Atomic Commit**: `feat(queue): implement FIFO controller`

## T-03 — Simultaneous Download & Decode with Cancellation
- **Objective**: Download and decode tracks through the queue.
- **Tasks**: `fetch(trackUrl, { signal })` -> `arrayBuffer()` -> `decodeAudioData()` -> resolve the task with the `AudioBuffer`; cancel a task through its `AbortController`.
- **Contract**: Cancelling one task aborts only that task's download and decode; `AbortError` is not treated as a failure of the queue.
- **Verification**: Enqueue several tracks at once (all download and decode); cancel one mid-download (the request shows "canceled", the others continue); invalid URL and corrupt file reject without freezing the queue.
- **Atomic Commit**: `feat(audio): implement download & decode with AbortController`

## T-04 — Web Audio Engine (AnalyserNode)
- **Objective**: Play decoded buffers through an analyser.
- **Tasks**: Create the `AudioContext` and `AnalyserNode` (FFT 256/512 bins); connect `AudioBufferSourceNode` -> `AnalyserNode` -> destination; play the next track when the current one ends.
- **Contract**: A new `AudioBufferSourceNode` is created for every playback.
- **Verification**: The analyser is configured as specified; frequency data changes while audio plays.
- **Atomic Commit**: `feat(audio): integrate AnalyserNode playback graph`

## T-05 — 60fps Visualizer
- **Objective**: Draw the frequency data in real time.
- **Tasks**: Canvas (or SVG) visualizer driven by `requestAnimationFrame`; allocate the frequency data array once and reuse it; store the frame id and cancel the loop when stopped.
- **Contract**: No per-frame state updates and no per-frame allocation (no state thrashing).
- **Verification**: The DevTools Performance panel shows ~60fps; the bars respond to the audio; stopping cancels the loop.
- **Atomic Commit**: `feat(viz): implement 60fps requestAnimationFrame visualizer`

## T-06 — Memory Safety
- **Objective**: Prove zero memory leaks.
- **Tasks**: Explicit cleanup of `AudioBufferSourceNode`s (`stop()`, `disconnect()`, drop references, remove `onended`) on finish, cancel, and teardown; abort active requests; cancel the animation frame; remove listeners.
- **Contract**: After cleanup nothing retains the audio graph, controllers, or listeners.
- **Verification**: 50 enqueue / play / cancel cycles with heap snapshots before and after: no growth in `AudioBufferSourceNode`s, `AudioBuffer`s, or listeners.
- **Atomic Commit**: `fix(audio): clean up AudioBufferSourceNodes & cancellation tokens`

---

## Required Commit Sequence
1. `docs(spec): define queue contract & WBS table`
2. `feat(queue): implement FIFO controller`
3. `feat(audio): implement download & decode with AbortController`
4. `feat(audio): integrate AnalyserNode playback graph`
5. `feat(viz): implement 60fps requestAnimationFrame visualizer`
6. `fix(audio): clean up AudioBufferSourceNodes & cancellation tokens`  