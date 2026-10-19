import type { AudioEngine } from "./audio-engine.js";

export class AudioVisualizer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly engine: AudioEngine;

  private frameId: number | null = null;
  private isRunning = false;
  private destroyed = false;

  private readonly handleResize = (): void => {
    this.resizeCanvas();
  };

  // Reuse the same callback; do not allocate one per frame.
  private readonly drawFrame = (): void => {
    this.frameId = null;

    if (!this.isRunning || this.destroyed) return;

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

      this.context.fillRect(
        i * barStep,
        height - barHeight,
        barWidth,
        barHeight
      );
    }

    // Schedule the next frame.
    this.frameId = requestAnimationFrame(this.drawFrame);
  };

  constructor(canvas: HTMLCanvasElement, engine: AudioEngine) {
    this.canvas = canvas;
    this.engine = engine;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is not supported.");
    }

    this.context = context;
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    if (this.destroyed) return;

    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.floor(this.canvas.clientWidth * ratio);
    const height = Math.floor(this.canvas.clientHeight * ratio);

    if (width <= 0 || height <= 0) return;

    if (
      this.canvas.width !== width ||
      this.canvas.height !== height
    ) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  start(): void {
    if (this.isRunning || this.destroyed) return;

    this.isRunning = true;
    this.resizeCanvas();

    window.addEventListener("resize", this.handleResize);
    this.frameId = requestAnimationFrame(this.drawFrame);
  }

  stop(): void {
    this.isRunning = false;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    window.removeEventListener("resize", this.handleResize);

    this.context.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  destroy(): void {
    if (this.destroyed) return;

    this.stop();
    this.destroyed = true;
  }
}