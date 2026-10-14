# HW2: Concurrent FIFO Audio Visualizer Queue Engine

Advanced async concurrency, audio frequency analysis, and zero memory leaks.

## Features
- **Engine**: Web Audio API integration with Web Audio AnalyserNode (FFT 256/512 bins).
- **Concurrency Controller**: FIFO Queue handling simultaneous track downloads and audio buffer decoding.
- **Memory Safety**: Explicit cleanup of AudioBufferSourceNodes, cancellation tokens via AbortController.
- **Performance**: 60fps Canvas or SVG visualizer driven by requestAnimationFrame without state thrashing.

## Controller Contract
```ts
// audio-queue-controller.ts
export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;

  async enqueue(trackUrl: string): Promise<AudioBuffer> {
    // Concurrency control with AbortSignal cancellation
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      this.queue.push({ trackUrl, controller, resolve, reject });
      this.processNext();
    });
  }
}
```

## Processing Flow
```
enqueue(trackUrl)
   ↓
FIFO queue  (one task processed at a time, in enqueue order)
   ↓
download (fetch + AbortSignal) → decode (AudioBuffer)
   ↓
AudioBufferSourceNode → AnalyserNode → destination
   ↓
requestAnimationFrame → Canvas / SVG visualizer
   ↓
stop / finish / cancel → cleanup (stop, disconnect, drop references)
```

## Project Structure
```
hw2-audio-queue/
├── index.html
├── audio-queue-controller.ts
├── audio-engine.ts
├── visualizer.ts
├── PROJECT_RULES.md
├── TASK_DECOMPOSITION.md
└── README.md
```

## Verification Checklist
- [ ] `AnalyserNode` is integrated and configured for FFT 256/512 bins
- [ ] Simultaneous enqueues are processed in FIFO order
- [ ] Track downloads and audio buffer decoding work through the queue
- [ ] A failed or cancelled task does not block the queue
- [ ] `AbortController` cancels only its own task
- [ ] `AudioBufferSourceNode`s are explicitly cleaned up
- [ ] Canvas or SVG visualizer is driven by `requestAnimationFrame`
- [ ] 60fps measured in the Performance panel, no state thrashing
- [ ] Repeated enqueue / play / cancel cycles show no memory growth
- [ ] No console errors

## Git History
One atomic commit per task — see `TASK_DECOMPOSITION.md` for the commit sequence.