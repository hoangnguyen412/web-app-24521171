function createAbortError() {
    return new DOMException("Audio task was cancelled.", "AbortError");
}
export class AudioTaskQueue {
    constructor(audioContext) {
        this.queue = [];
        this.isProcessing = false;
        this.activeController = null;
        this.activeTask = null;
        // Reuse one AudioContext for this queue.
        // T-04 can pass in its shared AudioContext.
        this.audioContext = audioContext ?? null;
    }
    async enqueue(trackUrl) {
        const controller = new AbortController();
        return new Promise((resolve, reject) => {
            this.queue.push({
                trackUrl,
                controller,
                resolve,
                reject,
            });
            void this.processNext();
        });
    }
    /**
     * Cancel the active task with this URL, or the first
     * queued task with this URL if none is active.
     * Returns false if no matching task is pending.
     */
    cancel(trackUrl) {
        // Cancel the active download/decode task first.
        if (this.activeTask?.trackUrl === trackUrl) {
            if (this.activeController?.signal.aborted) {
                return false;
            }
            this.activeController?.abort();
            return true;
        }
        // A queued task has not started downloading yet.
        const index = this.queue.findIndex((task) => task.trackUrl === trackUrl);
        if (index === -1) {
            return false;
        }
        const [task] = this.queue.splice(index, 1);
        if (!task) {
            return false;
        }
        task.controller.abort();
        task.reject(createAbortError());
        return true;
    }
    getAudioContext() {
        if (!this.audioContext) {
            if (typeof AudioContext === "undefined") {
                throw new Error("Web Audio API is not supported.");
            }
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }
    async loadAudioBuffer(trackUrl, signal) {
        if (signal.aborted) {
            throw createAbortError();
        }
        // 1. Download with task-specific cancellation.
        const response = await fetch(trackUrl, { signal });
        if (!response.ok) {
            throw new Error(`Audio download failed: HTTP ${response.status} ${response.statusText}`);
        }
        const audioData = await response.arrayBuffer();
        if (signal.aborted) {
            throw createAbortError();
        }
        // 2. Decode the downloaded audio.
        const context = this.getAudioContext();
        const audioBuffer = await context.decodeAudioData(audioData);
        // decodeAudioData() has no AbortSignal parameter.
        // Discard its result if the task was cancelled meanwhile.
        if (signal.aborted) {
            throw createAbortError();
        }
        return audioBuffer;
    }
    async processNext() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.queue.length > 0) {
                const task = this.queue.shift();
                if (!task) {
                    continue;
                }
                if (task.controller.signal.aborted) {
                    task.reject(createAbortError());
                    continue;
                }
                this.activeTask = task;
                this.activeController = task.controller;
                try {
                    const buffer = await this.loadAudioBuffer(task.trackUrl, task.controller.signal);
                    if (task.controller.signal.aborted) {
                        throw createAbortError();
                    }
                    task.resolve(buffer);
                }
                catch (error) {
                    // Reject this task only. Continue with the next task.
                    task.reject(error);
                }
                finally {
                    if (this.activeTask === task) {
                        this.activeTask = null;
                    }
                    if (this.activeController === task.controller) {
                        this.activeController = null;
                    }
                }
            }
        }
        finally {
            this.activeTask = null;
            this.activeController = null;
            this.isProcessing = false;
            // Do not leave queued work stranded.
            if (this.queue.length > 0) {
                void this.processNext();
            }
        }
    }
}
