export class AudioVisualizer {
    constructor(canvas, engine) {
        this.frameId = null;
        this.isRunning = false;
        this.destroyed = false;
        this.handleResize = () => {
            this.resizeCanvas();
        };
        // Reuse the same callback; do not allocate one per frame.
        this.drawFrame = () => {
            this.frameId = null;
            if (!this.isRunning || this.destroyed)
                return;
            const width = this.canvas.width;
            const height = this.canvas.height;
            // AudioEngine reuses its frequency data array.
            const data = this.engine.getFrequencyData();
            this.context.fillStyle = "#0b1220";
            this.context.fillRect(0, 0, width, height);
            const barStep = width / data.length;
            const barWidth = Math.max(1, barStep * 0.7);
            this.context.fillStyle = "#22c55e";
            for (let i = 0; i < data.length; i += 1) {
                const value = data[i] ?? 0;
                const barHeight = (value / 255) * height;
                this.context.fillRect(i * barStep, height - barHeight, barWidth, barHeight);
            }
            // Schedule the next frame.
            this.frameId = requestAnimationFrame(this.drawFrame);
        };
        this.canvas = canvas;
        this.engine = engine;
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Canvas 2D context is not supported.");
        }
        this.context = context;
        this.resizeCanvas();
    }
    resizeCanvas() {
        if (this.destroyed)
            return;
        const ratio = Math.max(1, window.devicePixelRatio || 1);
        const width = Math.floor(this.canvas.clientWidth * ratio);
        const height = Math.floor(this.canvas.clientHeight * ratio);
        if (width <= 0 || height <= 0)
            return;
        if (this.canvas.width !== width ||
            this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }
    start() {
        if (this.isRunning || this.destroyed)
            return;
        this.isRunning = true;
        this.resizeCanvas();
        window.addEventListener("resize", this.handleResize);
        this.frameId = requestAnimationFrame(this.drawFrame);
    }
    stop() {
        this.isRunning = false;
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        window.removeEventListener("resize", this.handleResize);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    destroy() {
        if (this.destroyed)
            return;
        this.stop();
        this.destroyed = true;
    }
}
