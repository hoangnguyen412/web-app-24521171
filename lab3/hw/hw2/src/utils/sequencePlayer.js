function createAbortError() {
  const error = new Error("Playback was aborted.");
  error.name = "AbortError";
  return error;
}

export function sleep(ms, signal) {
  if (!Number.isFinite(ms) || ms < 0) {
    return Promise.reject(
      new RangeError("Sleep duration must be a non-negative number."),
    );
  }

  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timerId);
      signal?.removeEventListener("abort", handleAbort);
    };

    const handleAbort = () => {
      if (settled) return;

      settled = true;
      cleanup();
      reject(createAbortError());
    };

    const timerId = setTimeout(() => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve();
    }, ms);

    signal?.addEventListener("abort", handleAbort, { once: true });

    // Handle an abort occurring immediately before listener registration.
    if (signal?.aborted) {
      handleAbort();
    }
  });
}

export async function playSequence(events, speed, handlers, signal) {
  if (!Array.isArray(events)) {
    throw new TypeError("events must be an array.");
  }

  if (![0.5, 1, 2].includes(speed)) {
    throw new RangeError("Speed must be 0.5, 1, or 2.");
  }

  if (
    typeof handlers?.noteOn !== "function" ||
    typeof handlers?.noteOff !== "function"
  ) {
    throw new TypeError("noteOn and noteOff handlers are required.");
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  // Track voices and their scheduled release timers.
  const activeNotes = new Set();
  const releaseTimers = new Map();

  const releaseAll = () => {
    for (const [timerId, release] of releaseTimers) {
      clearTimeout(timerId);
      release.resolve();
    }

    releaseTimers.clear();

    for (const midi of activeNotes) {
      try {
        handlers.noteOff(midi);
      } catch (error) {
        console.error("Unable to release MIDI note:", midi, error);
      }
    }

    activeNotes.clear();
  };

  const handleAbort = () => {
    releaseAll();
  };

  signal?.addEventListener("abort", handleAbort, { once: true });

  const releaseTasks = [];
  let completed = false;

  try {
    for (const event of events) {
      if (
        !Number.isInteger(event.midi) ||
        !Number.isFinite(event.freqHz) ||
        event.freqHz <= 0 ||
        !Number.isFinite(event.deltaMs) ||
        event.deltaMs < 0 ||
        !Number.isFinite(event.durationMs) ||
        event.durationMs < 0
      ) {
        throw new TypeError("Invalid recorded event.");
      }

      // Wait until this note's start time.
      await sleep(event.deltaMs / speed, signal);

      if (signal?.aborted) {
        throw createAbortError();
      }

      // Start the note without waiting for its duration.
      handlers.noteOn(event.midi, event.freqHz);
      activeNotes.add(event.midi);

      // Schedule its release independently.
      // This allows other notes to start while this one is playing.
      let timerId;

      const releaseTask = new Promise((resolve) => {
        const release = () => {
          releaseTimers.delete(timerId);

          if (activeNotes.delete(event.midi)) {
            handlers.noteOff(event.midi);
          }

          resolve();
        };

        timerId = setTimeout(
          release,
          event.durationMs / speed,
        );

        releaseTimers.set(timerId, { resolve });
      });

      releaseTasks.push(releaseTask);
    }

    // Wait until all scheduled notes have finished.
    await Promise.all(releaseTasks);

    if (signal?.aborted) {
      throw createAbortError();
    }

    completed = true;
  } finally {
    signal?.removeEventListener("abort", handleAbort);

    // Ensure unfinished notes are released on errors or cancellation.
    if (!completed) {
      releaseAll();
    }
  }
}