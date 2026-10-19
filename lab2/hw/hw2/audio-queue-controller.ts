export interface AudioTask {
  trackUrl: string;
  controller: AbortController;
  resolve: (buffer: AudioBuffer) => void;
  reject: (reason?: unknown) => void;
}

function createAbortError(): DOMException {
  return new DOMException(
    "Audio task was cancelled.",
    "AbortError"
  );
}

export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;
  private activeTask: AudioTask | null = null;
  private destroyed = false;

  private readonly sharedAudioContext: AudioContext | null;
  private ownedAudioContext: AudioContext | null = null;

  constructor(audioContext?: AudioContext) {
    this.sharedAudioContext = audioContext ?? null;
  }

  enqueue(trackUrl: string): Promise<AudioBuffer> {
    if (this.destroyed) {
      return Promise.reject(createAbortError());
    }

    return new Promise<AudioBuffer>((resolve, reject) => {
      this.queue.push({
        trackUrl,
        controller: new AbortController(),
        resolve,
        reject,
      });

      void this.processNext();
    });
  }

  cancel(trackUrl: string): boolean {
    if (this.destroyed) return false;

    if (
      this.activeTask?.trackUrl === trackUrl &&
      this.activeController &&
      !this.activeController.signal.aborted
    ) {
      this.activeController.abort();
      return true;
    }

    const index = this.queue.findIndex(
      (task) => task.trackUrl === trackUrl
    );

    if (index === -1) return false;

    const [task] = this.queue.splice(index, 1);

    if (!task) return false;

    task.controller.abort();
    task.reject(createAbortError());

    return true;
  }

  cancelAll(): void {
    // Abort the currently loading or decoding task.
    this.activeController?.abort();

    // Reject and remove all tasks that have not started.
    for (const task of this.queue.splice(0)) {
      task.controller.abort();
      task.reject(createAbortError());
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.cancelAll();

    // Do not close a context owned by AudioEngine.
    if (
      this.ownedAudioContext &&
      this.ownedAudioContext.state !== "closed"
    ) {
      void this.ownedAudioContext.close().catch(() => undefined);
    }

    this.ownedAudioContext = null;
  }

  private getAudioContext(): AudioContext {
    if (this.sharedAudioContext) {
      return this.sharedAudioContext;
    }

    if (!this.ownedAudioContext) {
      if (typeof AudioContext === "undefined") {
        throw new Error("Web Audio API is not supported.");
      }

      this.ownedAudioContext = new AudioContext();
    }

    return this.ownedAudioContext;
  }

  protected async loadAudioBuffer(
    trackUrl: string,
    signal: AbortSignal
  ): Promise<AudioBuffer> {
    if (signal.aborted) throw createAbortError();

    const response = await fetch(trackUrl, { signal });

    if (!response.ok) {
      throw new Error(
        `Audio download failed: HTTP ${response.status}`
      );
    }

    const audioData = await response.arrayBuffer();

    if (signal.aborted) throw createAbortError();

    const buffer = await this
      .getAudioContext()
      .decodeAudioData(audioData);

    // decodeAudioData cannot be cancelled directly.
    // Discard the decoded result if cancellation occurred meanwhile.
    if (signal.aborted || this.destroyed) {
      throw createAbortError();
    }

    return buffer;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.destroyed) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && !this.destroyed) {
        const task = this.queue.shift();

        if (!task) continue;

        if (task.controller.signal.aborted) {
          task.reject(createAbortError());
          continue;
        }

        this.activeTask = task;
        this.activeController = task.controller;

        try {
          const buffer = await this.loadAudioBuffer(
            task.trackUrl,
            task.controller.signal
          );

          if (task.controller.signal.aborted || this.destroyed) {
            throw createAbortError();
          }

          task.resolve(buffer);
        } catch (error: unknown) {
          // A failed task must not stop the remaining queue.
          task.reject(error);
        } finally {
          if (this.activeTask === task) {
            this.activeTask = null;
          }

          if (this.activeController === task.controller) {
            this.activeController = null;
          }
        }
      }
    } finally {
      this.activeTask = null;
      this.activeController = null;
      this.isProcessing = false;

      if (!this.destroyed && this.queue.length > 0) {
        void this.processNext();
      }
    }
  }
}