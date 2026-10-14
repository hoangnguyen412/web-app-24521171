import { AudioEngine } from "./audio-engine.js";

const trackUrlInput =
  document.querySelector<HTMLInputElement>("#track-url");

const playButton =
  document.querySelector<HTMLButtonElement>("#play-track");

const status =
  document.querySelector<HTMLElement>("#playback-status");

const frequencyOutput =
  document.querySelector<HTMLOutputElement>("#frequency-output");

let engine: AudioEngine | null = null;
let activeRequests = 0;
let monitorTimer: number | null = null;

function getEngine(): AudioEngine {
  if (!engine) {
    engine = new AudioEngine(512);
  }

  return engine;
}

function startFrequencyMonitor(audioEngine: AudioEngine): void {
  if (monitorTimer !== null) return;

  monitorTimer = window.setInterval(() => {
    const data = audioEngine.getFrequencyData();

    let total = 0;

    for (let index = 0; index < data.length; index += 1) {
      total += data[index] ?? 0;
    }

    const average = data.length > 0 ? total / data.length : 0;

    if (frequencyOutput) {
      frequencyOutput.value =
        `FFT size: ${audioEngine.analyser.fftSize} | ` +
        `Frequency bins: ${data.length} | ` +
        `Average level: ${average.toFixed(1)}`;
    }
  }, 150);
}

function stopFrequencyMonitor(): void {
  if (monitorTimer === null) return;

  window.clearInterval(monitorTimer);
  monitorTimer = null;
}

playButton?.addEventListener("click", async () => {
  const trackUrl = trackUrlInput?.value.trim();

  if (!trackUrl) {
    if (status) {
      status.textContent = "Enter an audio URL first.";
    }
    return;
  }

  try {
    const audioEngine = getEngine();

    activeRequests += 1;
    startFrequencyMonitor(audioEngine);

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

    if (activeRequests === 0) {
      stopFrequencyMonitor();
    }
  }
});