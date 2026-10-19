function createAbortError() {
    return new DOMException("Audio task was cancelled.", "AbortError");
}
export class AudioTaskQueue {
    constructor(audioContext) {
        this.queue = [];
        this.isProcessing = false;
        this.activeController = null;
        this.activeTask = null;
        this.destroyed = false;
        this.ownedAudioContext = null;
        this.sharedAudioContext = audioContext ?? null;
    }
    enqueue(trackUrl) {
        if (this.destroyed) {
            return Promise.reject(createAbortError());
        }
        return new Promise((resolve, reject) => {
            this.queue.push({
                trackUrl,
                controller: new AbortController(),
                resolve,
                reject,
            });
            void this.processNext();
        });
    }
    cancel(trackUrl) {
        if (this.destroyed)
            return false;
        if (this.activeTask?.trackUrl === trackUrl &&
            this.activeController &&
            !this.activeController.signal.aborted) {
            this.activeController.abort();
            return true;
        }
        const index = this.queue.findIndex((task) => task.trackUrl === trackUrl);
        if (index === -1)
            return false;
        const [task] = this.queue.splice(index, 1);
        if (!task)
            return false;
        task.controller.abort();
        task.reject(createAbortError());
        return true;
    }
    cancelAll() {
        // Abort the currently loading or decoding task.
        this.activeController?.abort();
        // Reject and remove all tasks that have not started.
        for (const task of this.queue.splice(0)) {
            task.controller.abort();
            task.reject(createAbortError());
        }
    }
    destroy() {
        if (this.destroyed)
            return;
        this.destroyed = true;
        this.cancelAll();
        // Do not close a context owned by AudioEngine.
        if (this.ownedAudioContext &&
            this.ownedAudioContext.state !== "closed") {
            void this.ownedAudioContext.close().catch(() => undefined);
        }
        this.ownedAudioContext = null;
    }
    getAudioContext() {
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
    async loadAudioBuffer(trackUrl, signal) {
        if (signal.aborted)
            throw createAbortError();
        const response = await fetch(trackUrl, { signal });
        if (!response.ok) {
            throw new Error(`Audio download failed: HTTP ${response.status}`);
        }
        const audioData = await response.arrayBuffer();
        if (signal.aborted)
            throw createAbortError();
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
    async processNext() {
        if (this.isProcessing || this.destroyed)
            return;
        this.isProcessing = true;
        try {
            while (this.queue.length > 0 && !this.destroyed) {
                const task = this.queue.shift();
                if (!task)
                    continue;
                if (task.controller.signal.aborted) {
                    task.reject(createAbortError());
                    continue;
                }
                this.activeTask = task;
                this.activeController = task.controller;
                try {
                    const buffer = await this.loadAudioBuffer(task.trackUrl, task.controller.signal);
                    if (task.controller.signal.aborted || this.destroyed) {
                        throw createAbortError();
                    }
                    task.resolve(buffer);
                }
                catch (error) {
                    // A failed task must not stop the remaining queue.
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
            if (!this.destroyed && this.queue.length > 0) {
                void this.processNext();
            }
        }
    }
}
