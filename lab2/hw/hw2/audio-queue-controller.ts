export interface AudioTask {
  trackUrl: string;
  controller: AbortController;
  resolve: (buffer: AudioBuffer) => void;
  reject: (reason?: unknown) => void;
}

export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;

  async enqueue(trackUrl: string): Promise<AudioBuffer> {
    const controller = new AbortController();

    return new Promise<AudioBuffer>((resolve, reject) => {
      this.queue.push({
        trackUrl,
        controller,
        resolve,
        reject,
      });

      void this.processNext();
    });
  }

  // T-03 will implement the actual fetch and audio decoding.
  protected async loadAudioBuffer(
    _trackUrl: string,
    _signal: AbortSignal
  ): Promise<AudioBuffer> {
    throw new Error(
      "Audio loading will be implemented in T-03."
    );
  }

  private async processNext(): Promise<void> {
    // Prevent multiple workers from processing the queue.
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift();

        if (!task) continue;

        this.activeController = task.controller;

        try {
          if (task.controller.signal.aborted) {
            throw new DOMException(
              "The task was cancelled.",
              "AbortError"
            );
          }

          const buffer = await this.loadAudioBuffer(
            task.trackUrl,
            task.controller.signal
          );

          if (task.controller.signal.aborted) {
            throw new DOMException(
              "The task was cancelled.",
              "AbortError"
            );
          }

          // Resolve only the promise belonging to this task.
          task.resolve(buffer);
        } catch (error: unknown) {
          // Reject this task, but continue processing the queue.
          task.reject(error);
        } finally {
          if (this.activeController === task.controller) {
            this.activeController = null;
          }
        }
      }
    } finally {
      this.isProcessing = false;

      // Ensure queued tasks are not stranded.
      if (this.queue.length > 0) {
        void this.processNext();
      }
    }
  }
}