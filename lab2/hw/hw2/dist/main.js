import { AudioEngine } from "./audio-engine.js";
import { AudioVisualizer } from "./visualizer.js";
const trackUrlInput = document.querySelector("#track-url");
const playButton = document.querySelector("#play-track");
const status = document.querySelector("#playback-status");
const canvas = document.querySelector("#audio-visualizer");
let engine = null;
let visualizer = null;
let activeRequests = 0;
function getAudioEngine() {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (status) {
            status.textContent = `Playback failed: ${message}`;
        }
    }
    finally {
        activeRequests -= 1;
        // Stop rendering when every queued playback request has settled.
        if (activeRequests === 0) {
            visualizer?.stop();
        }
    }
});
