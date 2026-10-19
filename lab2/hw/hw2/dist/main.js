import { AudioEngine } from "./audio-engine.js";
import { AudioVisualizer } from "./visualizer.js";
const trackUrlInput = document.querySelector("#track-url");
const playButton = document.querySelector("#play-track");
const stopButton = document.querySelector("#stop-playback");
const status = document.querySelector("#playback-status");
const canvas = document.querySelector("#audio-visualizer");
const queueList = document.querySelector("#track-queue");
let engine = null;
let visualizer = null;
let nextTrackId = 1;
let activeRequests = 0;
let disposed = false;
// UI playback chain mirrors the engine's playback order.
let uiPlaybackChain = Promise.resolve();
const tracks = [];
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
// Display every submitted track in insertion/FIFO order.
function renderQueue() {
    if (!queueList)
        return;
    const fragment = document.createDocumentFragment();
    for (const track of tracks) {
        const item = document.createElement("li");
        const number = document.createElement("strong");
        number.textContent = `#${track.id}`;
        const url = document.createElement("span");
        url.className = "track-url";
        url.textContent = track.url;
        const badge = document.createElement("span");
        badge.className = `track-status status-${track.status.toLowerCase()}`;
        badge.textContent = track.status;
        item.append(number, url, badge);
        fragment.appendChild(item);
    }
    queueList.replaceChildren(fragment);
}
function setStatus(message) {
    if (!disposed && status) {
        status.textContent = message;
    }
}
function isAbortError(error) {
    return error instanceof Error && error.name === "AbortError";
}
function handlePlayClick() {
    const trackUrl = trackUrlInput?.value.trim();
    if (!trackUrl) {
        setStatus("Enter an audio URL first.");
        return;
    }
    let audioEngine;
    try {
        audioEngine = getAudioEngine();
    }
    catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
        return;
    }
    const entry = {
        id: nextTrackId++,
        url: trackUrl,
        status: "Queued",
    };
    tracks.push(entry);
    renderQueue();
    activeRequests += 1;
    visualizer?.start();
    setStatus(`Added track #${entry.id} to the FIFO queue.`);
    // Submit immediately so the engine can load tracks in FIFO order.
    const playbackPromise = audioEngine.enqueueAndPlay(trackUrl);
    const uiTask = uiPlaybackChain.then(async () => {
        try {
            if (entry.status !== "Cancelled") {
                entry.status = "Playing";
                renderQueue();
                setStatus(`Playing track #${entry.id}.`);
            }
            await playbackPromise;
            if (!disposed && entry.status !== "Cancelled") {
                entry.status = "Completed";
                setStatus(`Track #${entry.id} completed.`);
            }
        }
        catch (error) {
            if (!disposed) {
                if (isAbortError(error) || entry.status === "Cancelled") {
                    entry.status = "Cancelled";
                    setStatus(`Track #${entry.id} cancelled.`);
                }
                else {
                    entry.status = "Failed";
                    const message = error instanceof Error ? error.message : String(error);
                    setStatus(`Track #${entry.id} failed: ${message}`);
                }
            }
        }
        finally {
            activeRequests -= 1;
            if (!disposed) {
                renderQueue();
                if (activeRequests === 0) {
                    visualizer?.stop();
                }
            }
        }
    });
    // Keep the UI chain alive even if an unexpected UI error occurs.
    uiPlaybackChain = uiTask.catch((error) => {
        console.error("Queue UI error:", error);
    });
}
function handleStopClick() {
    if (!engine) {
        visualizer?.stop();
        setStatus("There are no tracks to stop.");
        return;
    }
    // stopAll() stops current playback and cancels pending tasks.
    engine.stopAll();
    visualizer?.stop();
    for (const track of tracks) {
        if (track.status === "Queued" || track.status === "Playing") {
            track.status = "Cancelled";
        }
    }
    renderQueue();
    setStatus("Playback stopped. Active and pending tracks cancelled.");
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
window.addEventListener("pagehide", handlePageHide, {
    once: true,
});
