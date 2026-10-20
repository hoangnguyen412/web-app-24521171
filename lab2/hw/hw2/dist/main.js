import { AudioEngine } from "./audio-engine.js";
import { AudioVisualizer } from "./visualizer.js";
const audioForm = document.querySelector("#audio-form");
const trackUrlInput = document.querySelector("#track-url");
const stopButton = document.querySelector("#stop-playback");
const statusElement = document.querySelector("#playback-status");
const canvas = document.querySelector("#audio-visualizer");
const queueList = document.querySelector("#track-queue");
let engine = null;
let visualizer = null;
let nextTrackId = 1;
let activeRequests = 0;
let disposed = false;
let uiPlaybackChain = Promise.resolve();
const tracks = [];
function setStatus(message) {
    if (statusElement) {
        statusElement.textContent = message;
    }
}
function isCancelled(entry) {
    return entry.status === "Cancelled";
}
function renderQueue() {
    if (!queueList) {
        return;
    }
    const items = tracks.map((track) => {
        const item = document.createElement("li");
        item.className = "track-item";
        const url = document.createElement("span");
        url.className = "track-url";
        url.textContent = track.url;
        const status = document.createElement("span");
        status.className = `track-status status-${track.status.toLowerCase()}`;
        status.textContent = track.status;
        item.append(url, status);
        return item;
    });
    queueList.replaceChildren(...items);
}
function getAudioEngine() {
    if (!engine) {
        if (!canvas) {
            throw new Error("The audio visualizer canvas was not found.");
        }
        engine = new AudioEngine(512);
        visualizer = new AudioVisualizer(canvas, engine);
    }
    return engine;
}
function isAbortError(error) {
    if (error instanceof DOMException) {
        return error.name === "AbortError";
    }
    return (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError");
}
function enqueueTrack(rawUrl) {
    if (disposed) {
        return;
    }
    const url = rawUrl.trim();
    if (!url) {
        setStatus("Enter a direct audio file URL.");
        trackUrlInput?.focus();
        return;
    }
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            setStatus("Use a valid HTTP or HTTPS audio URL.");
            return;
        }
    }
    catch {
        setStatus("Enter a valid audio URL.");
        trackUrlInput?.focus();
        return;
    }
    let audioEngine;
    try {
        audioEngine = getAudioEngine();
    }
    catch (error) {
        setStatus(error instanceof Error
            ? error.message
            : "Unable to initialize audio.");
        return;
    }
    const entry = {
        id: nextTrackId++,
        url,
        status: "Queued",
    };
    tracks.push(entry);
    renderQueue();
    setStatus("Track added to the FIFO queue.");
    activeRequests += 1;
    visualizer?.start();
    const playbackResult = audioEngine.enqueueAndPlay(url).then(() => ({ success: true }), (error) => ({ success: false, error }));
    const uiTask = uiPlaybackChain.then(async () => {
        try {
            if (isCancelled(entry)) {
                return;
            }
            entry.status = "Playing";
            renderQueue();
            const result = await playbackResult;
            if (isCancelled(entry)) {
                return;
            }
            if (result.success) {
                entry.status = "Completed";
            }
            else if (isAbortError(result.error)) {
                entry.status = "Cancelled";
            }
            else {
                entry.status = "Failed";
                console.error("Audio track failed:", result.error);
            }
            renderQueue();
            if (entry.status === "Failed") {
                setStatus("A track failed to load or play. The queue can continue.");
            }
        }
        finally {
            activeRequests = Math.max(0, activeRequests - 1);
            renderQueue();
            if (activeRequests === 0) {
                visualizer?.stop();
                if (!disposed) {
                    setStatus("Queue finished.");
                }
            }
        }
    });
    uiPlaybackChain = uiTask.catch((error) => {
        console.error("Queue UI error:", error);
        setStatus("An unexpected queue error occurred.");
    });
}
function handleFormSubmit(event) {
    event.preventDefault();
    enqueueTrack(trackUrlInput?.value ?? "");
}
function handleStopClick() {
    if (!engine) {
        setStatus("There is no active playback to stop.");
        return;
    }
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
    if (disposed) {
        return;
    }
    disposed = true;
    audioForm?.removeEventListener("submit", handleFormSubmit);
    stopButton?.removeEventListener("click", handleStopClick);
    window.removeEventListener("pagehide", handlePageHide);
    visualizer?.destroy();
    engine?.destroy();
}
audioForm?.addEventListener("submit", handleFormSubmit);
stopButton?.addEventListener("click", handleStopClick);
window.addEventListener("pagehide", handlePageHide);
