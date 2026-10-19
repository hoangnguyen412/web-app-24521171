import { AudioTaskQueue } from "./audio-queue-controller.js";

export type SupportedFftSize = 256 | 512;

interface PlaybackRequest {
  trackUrl: string;
  cancelled: boolean;
  loadSettled: boolean;
}

interface ActivePlayback {
  request: PlaybackRequest;
  source: AudioBufferSourceNode;
  cancel: () => void;
}

type LoadResult =
  | { ok: true; buffer: AudioBuffer }
  | { ok: false; error: unknown };

function createAbortError(): DOMException {
  return new DOMException(
    "Audio playback was cancelled.",
    "AbortError"
  );
}

export class AudioEngine {
  readonly audioContext: AudioContext;
  readonly analyser: AnalyserNode;

  private readonly taskQueue: AudioTaskQueue;
  private readonly frequencyData: Uint8Array<ArrayBuffer>;
  private readonly pendingRequests = new Set<PlaybackRequest>();

  private playbackChain: Promise<void> = Promise.resolve();
  private currentPlayback: ActivePlayback | null = null;
  private destroyed = false;

  constructor(fftSize: SupportedFftSize = 512) {
    this.audioContext = new AudioContext();

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.connect(this.audioContext.destination);

    this.taskQueue = new AudioTaskQueue(this.audioContext);

    // Allocate once and reuse for every visualizer frame.
    this.frequencyData = new Uint8Array(
      this.analyser.frequencyBinCount
    );
  }

  enqueueAndPlay(trackUrl: string): Promise<void> {
    if (this.destroyed) {
      return Promise.reject(createAbortError());
    }

    const request: PlaybackRequest = {
      trackUrl,
      cancelled: false,
      loadSettled: false,
    };

    this.pendingRequests.add(request);

    // Resume immediately from the user's click interaction.
    const resumePromise =
      this.audioContext.state === "suspended"
        ? this.audioContext.resume()
        : Promise.resolve();

    // Attach both handlers immediately to avoid unhandled rejections
    // while the request waits for an earlier track to finish.
    const loadResult: Promise<LoadResult> = this.taskQueue
      .enqueue(trackUrl)
      .then(
        (buffer): LoadResult => {
          request.loadSettled = true;
          return { ok: true, buffer };
        },
        (error: unknown): LoadResult => {
          request.loadSettled = true;
          return { ok: false, error };
        }
      );

    // Preserve playback order.
    const playback = this.playbackChain
      .then(async () => {
        await resumePromise;

        if (this.destroyed || request.cancelled) {
          throw createAbortError();
        }

        const result = await loadResult;

        if (!result.ok) {
          throw result.error;
        }

        if (this.destroyed || request.cancelled) {
          throw createAbortError();
        }

        await this.playBuffer(result.buffer, request);
      })
      .finally(() => {
        this.pendingRequests.delete(request);
      });

    // A rejected playback must not block later tracks.
    this.playbackChain = playback.catch(() => undefined);

    return playback;
  }

  cancel(trackUrl: string): boolean {
    if (this.destroyed) return false;

    // Match the earliest pending playback with this URL.
    const request = Array.from(this.pendingRequests).find(
      (item) => item.trackUrl === trackUrl
    );

    if (!request) return false;

    request.cancelled = true;

    if (this.currentPlayback?.request === request) {
      this.currentPlayback.cancel();
      return true;
    }

    // If the buffer is already loaded, only mark the waiting
    // playback as cancelled; do not accidentally cancel another
    // download using the same URL.
    if (!request.loadSettled) {
      this.taskQueue.cancel(trackUrl);
    }

    return true;
  }

  // Cancel current playback and all queued or pending tracks.
  // The engine can be reused after this method.
  stopAll(): void {
    if (this.destroyed) return;

    this.cancelPendingWork();
  }

  private cancelPendingWork(): void {
    for (const request of this.pendingRequests) {
      request.cancelled = true;
    }

    this.taskQueue.cancelAll();
    this.currentPlayback?.cancel();
  }

  getFrequencyData(): Uint8Array<ArrayBuffer> {
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;

    this.destroyed = true;

    this.cancelPendingWork();
    this.taskQueue.destroy();

    try {
      this.analyser.disconnect();
    } catch {
      // The analyser may already be disconnected.
    }

    if (this.audioContext.state !== "closed") {
      try {
        await this.audioContext.close();
      } catch {
        // The context may already be closing.
      }
    }
  }

  private playBuffer(
    buffer: AudioBuffer,
    request: PlaybackRequest
  ): Promise<void> {
    if (this.destroyed || request.cancelled) {
      return Promise.reject(createAbortError());
    }

    return new Promise<void>((resolve, reject) => {
      // Every playback receives a new source node.
      const source = this.audioContext.createBufferSource();

      source.buffer = buffer;
      source.connect(this.analyser);

      let settled = false;

      const cleanup = (): void => {
        if (settled) return;

        settled = true;

        // Remove the callback before stopping to avoid re-entry.
        source.onended = null;

        try {
          source.stop();
        } catch {
          // The source might not have started or may have ended.
        }

        try {
          source.disconnect();
        } catch {
          // The source may already be disconnected.
        }

        // Release the source's reference to the decoded audio.
        source.buffer = null;

        if (this.currentPlayback?.source === source) {
          this.currentPlayback = null;
        }
      };

      const finish = (error?: unknown): void => {
        if (settled) return;

        cleanup();

        if (error !== undefined) {
          reject(error);
        } else {
          resolve();
        }
      };

      const cancel = (): void => {
        finish(createAbortError());
      };

      source.onended = () => finish();

      this.currentPlayback = {
        request,
        source,
        cancel,
      };

      try {
        source.start(0);
      } catch (error: unknown) {
        finish(error);
      }
    });
  }
}