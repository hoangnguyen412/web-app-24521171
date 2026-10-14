import { AudioTaskQueue } from "./audio-queue-controller.js";

export type SupportedFftSize = 256 | 512;

type LoadResult =
  | { ok: true; buffer: AudioBuffer }
  | { ok: false; error: unknown };

export class AudioEngine {
  readonly audioContext: AudioContext;
  readonly analyser: AnalyserNode;

  private readonly taskQueue: AudioTaskQueue;
  private readonly frequencyData: Uint8Array;

  private playbackChain: Promise<void> = Promise.resolve();
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(fftSize: SupportedFftSize = 512) {
    this.audioContext = new AudioContext();

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.8;

    // Shared graph: source -> analyser -> speakers.
    this.analyser.connect(this.audioContext.destination);

    // Reuse the same AudioContext for downloading and decoding.
    this.taskQueue = new AudioTaskQueue(this.audioContext);

    // Allocate once; reuse the array when reading frequency data.
    this.frequencyData = new Uint8Array(
      this.analyser.frequencyBinCount
    );
  }

  /**
   * Download and play a track in FIFO order.
   * The returned promise resolves when this track finishes playing.
   */
  enqueueAndPlay(trackUrl: string): Promise<void> {
    // Call resume directly from the user's interaction.
    const resumePromise =
      this.audioContext.state === "suspended"
        ? this.audioContext.resume()
        : Promise.resolve();

    // Convert rejection into a result immediately so a queued
    // download failure does not create an unhandled rejection
    // while waiting for an earlier track to finish playing.
    const loadResult: Promise<LoadResult> = this.taskQueue
      .enqueue(trackUrl)
      .then(
        (buffer): LoadResult => ({ ok: true, buffer }),
        (error: unknown): LoadResult => ({ ok: false, error })
      );

    // Every playback waits for the previous playback to finish.
    const playback = this.playbackChain.then(async () => {
      await resumePromise;

      const result = await loadResult;

      if (!result.ok) {
        throw result.error;
      }

      await this.playBuffer(result.buffer);
    });

    // A failed track must not stop subsequent queued playback.
    this.playbackChain = playback.catch(() => undefined);

    return playback;
  }

  /**
   * Cancel a queued or currently downloading task by URL.
   * Returns false if that task is no longer pending.
   */
  cancel(trackUrl: string): boolean {
    return this.taskQueue.cancel(trackUrl);
  }

  /**
   * Read current frequency data.
   * The same Uint8Array is reused on each call.
   */
getFrequencyData(): Uint8Array {
  this.analyser.getByteFrequencyData(
    this.frequencyData as Uint8Array<ArrayBuffer>
  );
  return this.frequencyData;
}

  private playBuffer(buffer: AudioBuffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Web Audio source nodes can only be started once.
      const source = this.audioContext.createBufferSource();

      source.buffer = buffer;
      source.connect(this.analyser);

      this.currentSource = source;

      let finished = false;

      const cleanup = (): void => {
        if (finished) return;
        finished = true;

        source.onended = null;

        try {
          source.disconnect();
        } catch {
          // The node may already be disconnected.
        }

        if (this.currentSource === source) {
          this.currentSource = null;
        }
      };

      source.onended = () => {
        cleanup();

        // Resolving allows the next track to begin.
        resolve();
      };

      try {
        source.start(0);
      } catch (error: unknown) {
        cleanup();
        reject(error);
      }
    });
  }
}