export class AudioVisualizer {
    constructor(canvas, engine) {
        this.frameId = null;
        this.isRunning = false;
        this.handleResize = () => {
            this.resizeCanvas();
        };
        // Reuse this callback rather than creating a new one per frame.
        this.drawFrame = () => {
            if (!this.isRunning)
                return;
            const width = this.canvas.width;
            const height = this.canvas.height;
            // AudioEngine reuses the same frequency data array.
            const frequencyData = this.engine.getFrequencyData();
            this.context.clearRect(0, 0, width, height);
            this.context.fillStyle = "#0b1220";
            this.context.fillRect(0, 0, width, height);
            const barStep = width / frequencyData.length;
            const barWidth = Math.max(1, barStep * 0.7);
            this.context.fillStyle = "#22c55e";
            for (let index = 0; index < frequencyData.length; index += 1) {
                const value = frequencyData[index] ?? 0;
                const barHeight = (value / 255) * height;
                const x = index * barStep;
                const y = height - barHeight;
                this.context.fillRect(x, y, barWidth, barHeight);
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
        const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
        const width = Math.floor(this.canvas.clientWidth * pixelRatio);
        const height = Math.floor(this.canvas.clientHeight * pixelRatio);
        if (width > 0 && height > 0) {
            if (this.canvas.width !== width ||
                this.canvas.height !== height) {
                this.canvas.width = width;
                this.canvas.height = height;
            }
        }
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.resizeCanvas();
        window.addEventListener("resize", this.handleResize);
        this.frameId = requestAnimationFrame(this.drawFrame);
    }
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        window.removeEventListener("resize", this.handleResize);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    destroy() {
        this.stop();
    }
}
