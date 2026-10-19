import { AudioEngine } from "./audio-engine.js";
import { AudioVisualizer } from "./visualizer.js";

const trackUrlInput =
  document.querySelector<HTMLInputElement>("#track-url");

const playButton =
  document.querySelector<HTMLButtonElement>("#play-track");

const stopButton =
  document.querySelector<HTMLButtonElement>("#stop-playback");

const status =
  document.querySelector<HTMLElement>("#playback-status");

const canvas =
  document.querySelector<HTMLCanvasElement>("#audio-visualizer");

let engine: AudioEngine | null = null;
let visualizer: AudioVisualizer | null = null;
let activeRequests = 0;
let disposed = false;

function getAudioEngine(): AudioEngine {
  if (!engine) {
    if (!canvas) {
      throw new Error("Audio visualizer canvas was not found.");
    }

    engine = new AudioEngine(512);
    visualizer = new AudioVisualizer(canvas, engine);
  }

  return engine;
}

async function playTrack(): Promise<void> {
  const trackUrl = trackUrlInput?.value.trim();

  if (!trackUrl) {
    if (status) status.textContent = "Enter an audio URL first.";
    return;
  }

  activeRequests += 1;

  try {
    const audioEngine = getAudioEngine();

    visualizer?.start();

    if (status) {
      status.textContent = `Queued: ${trackUrl}`;
    }

    await audioEngine.enqueueAndPlay(trackUrl);

    if (!disposed && status) {
      status.textContent = `Playback finished: ${trackUrl}`;
    }
  } catch (error: unknown) {
    if (!disposed && status) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        status.textContent = "Playback cancelled.";
      } else {
        const message =
          error instanceof Error ? error.message : String(error);

        status.textContent = `Playback failed: ${message}`;
      }
    }
  } finally {
    activeRequests -= 1;

    if (activeRequests === 0) {
      visualizer?.stop();
    }
  }
}

function handlePlayClick(): void {
  void playTrack();
}

function handleStopClick(): void {
  engine?.stopAll();
  visualizer?.stop();

  if (status) {
    status.textContent = "Playback stopped; pending tracks cancelled.";
  }
}

function handlePageHide(): void {
  if (disposed) return;

  disposed = true;

  playButton?.removeEventListener("click", handlePlayClick);
  stopButton?.removeEventListener("click", handleStopClick);
  window.removeEventListener("pagehide", handlePageHide);

  visualizer?.destroy();
  visualizer = null;

  const oldEngine = engine;
  engine = null;

  if (oldEngine) {
    void oldEngine.destroy();
  }
}

playButton?.addEventListener("click", handlePlayClick);
stopButton?.addEventListener("click", handleStopClick);
window.addEventListener("pagehide", handlePageHide, { once: true });