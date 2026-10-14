export interface AudioTask {
  trackUrl: string;
  controller: AbortController;
  resolve: (buffer: AudioBuffer) => void;
  reject: (reason?: unknown) => void;
}

export declare class AudioTaskQueue {
  private queue: AudioTask[];
  private isProcessing: boolean;
  private activeController: AbortController | null;

  enqueue(trackUrl: string): Promise<AudioBuffer>;
}