import { AudioEngine } from "./audio-engine.js";
import { AudioVisualizer } from "./visualizer.js";
const trackUrlInput = document.querySelector("#track-url");
const playButton = document.querySelector("#play-track");
const stopButton = document.querySelector("#stop-playback");
const status = document.querySelector("#playback-status");
const canvas = document.querySelector("#audio-visualizer");
let engine = null;
let visualizer = null;
let activeRequests = 0;
let disposed = false;
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
async function playTrack() {
    const trackUrl = trackUrlInput?.value.trim();
    if (!trackUrl) {
        if (status)
            status.textContent = "Enter an audio URL first.";
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
    }
    catch (error) {
        if (!disposed && status) {
            if (error instanceof Error &&
                error.name === "AbortError") {
                status.textContent = "Playback cancelled.";
            }
            else {
                const message = error instanceof Error ? error.message : String(error);
                status.textContent = `Playback failed: ${message}`;
            }
        }
    }
    finally {
        activeRequests -= 1;
        if (activeRequests === 0) {
            visualizer?.stop();
        }
    }
}
function handlePlayClick() {
    void playTrack();
}
function handleStopClick() {
    engine?.stopAll();
    visualizer?.stop();
    if (status) {
        status.textContent = "Playback stopped; pending tracks cancelled.";
    }
}
function handlePageHide() {
    if (disposed)
        return;
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
