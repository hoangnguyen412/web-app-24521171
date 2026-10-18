import { AudioEngine } from "./audio-engine.js";
import { AudioVisualizer } from "./visualizer.js";

const trackUrlInput =
  document.querySelector<HTMLInputElement>("#track-url");

const playButton =
  document.querySelector<HTMLButtonElement>("#play-track");

const status =
  document.querySelector<HTMLElement>("#playback-status");

const canvas =
  document.querySelector<HTMLCanvasElement>("#audio-visualizer");

let engine: AudioEngine | null = null;
let visualizer: AudioVisualizer | null = null;
let activeRequests = 0;

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

playButton?.addEventListener("click", async () => {
  const trackUrl = trackUrlInput?.value.trim();

  if (!trackUrl) {
    if (status) {
      status.textContent = "Enter an audio URL first.";
    }

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

    if (status) {
      status.textContent = `Playback finished: ${trackUrl}`;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);

    if (status) {
      status.textContent = `Playback failed: ${message}`;
    }
  } finally {
    activeRequests -= 1;

    // Stop rendering when every queued playback request has settled.
    if (activeRequests === 0) {
      visualizer?.stop();
    }
  }
});