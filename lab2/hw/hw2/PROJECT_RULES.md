# PROJECT RULES — HW2: Concurrent FIFO Audio Visualizer Queue Engine

## 1. Architecture
- Use **TypeScript** and the browser-native **Web Audio API**.
- **Contract-First**: `AudioTaskQueue` in `audio-queue-controller.ts` is defined before implementation.
- Focus: advanced async concurrency, audio frequency analysis, and zero memory leaks.

## 2. Engine
- Web Audio API integration with a Web Audio `AnalyserNode` (**FFT 256/512 bins**).
- One shared `AudioContext`; a new `AudioBufferSourceNode` is created for each playback.

## 3. Concurrency Controller
- **FIFO Queue** handling simultaneous track downloads and audio buffer decoding.
- `enqueue(trackUrl: string): Promise<AudioBuffer>` creates one `AbortController` per task and pushes `{ trackUrl, controller, resolve, reject }` to the queue.
- State: `queue: AudioTask[]`, `isProcessing`, `activeController: AbortController | null`.
- Tasks are processed in enqueue order; a failed or cancelled task settles only its own promise and the queue continues with the next task.

## 4. Memory Safety
- **Explicit cleanup of `AudioBufferSourceNode`s**: `stop()`, `disconnect()`, drop references, remove `onended`.
- **Cancellation tokens via `AbortController`**: cancelling a task aborts its own fetch and decode only.
- Cancel the `requestAnimationFrame` loop and remove listeners during cleanup.

## 5. Performance
- **60fps Canvas or SVG visualizer** driven by `requestAnimationFrame`.
- **No state thrashing**: no per-frame state updates and no per-frame allocation (reuse one frequency data array).
- Measure 60fps in the DevTools Performance panel; do not claim it without measuring.

## 6. Verification
- Do not claim "zero memory leaks" from code inspection alone: repeated enqueue / play / cancel cycles must show no accumulating nodes or memory (heap snapshots).
- No project-caused console errors.