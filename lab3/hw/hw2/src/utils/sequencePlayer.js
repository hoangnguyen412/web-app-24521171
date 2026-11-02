function createAbortError() {
  const error = new Error("Playback was aborted.");
  error.name = "AbortError";
  return error;
}

export function sleep(ms, signal) {
  if (!Number.isFinite(ms) || ms < 0) {
    return Promise.reject(
      new RangeError("Sleep duration must be non-negative."),
    );
  }

  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    let timerId;
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

    timerId = setTimeout(() => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve();
    }, ms);

    signal?.addEventListener("abort", handleAbort, {
      once: true,
    });

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

  const activeNotes = new Set();
  const releaseTimers = new Set();

  // Release every active note and cancel all pending note-off timers.
  const releaseAll = () => {
    for (const task of releaseTimers) {
      clearTimeout(task.timerId);
      task.resolve();
    }

    releaseTimers.clear();

    for (const midi of activeNotes) {
      try {
        handlers.noteOff(midi);
      } catch (error) {
        console.error("Unable to release note:", midi, error);
      }
    }

    activeNotes.clear();
  };

  const handleAbort = () => {
    releaseAll();
  };

  signal?.addEventListener("abort", handleAbort, {
    once: true,
  });

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

      // Wait until the next note's start time.
      await sleep(event.deltaMs / speed, signal);

      if (signal?.aborted) {
        throw createAbortError();
      }

      // Start note without blocking the next event.
      handlers.noteOn(event.midi, event.freqHz);
      activeNotes.add(event.midi);

      // Schedule this note's release independently.
      const releaseTask = new Promise((resolve) => {
        const task = {
          timerId: null,
          resolve,
        };

        task.timerId = setTimeout(() => {
          releaseTimers.delete(task);

          try {
            if (activeNotes.delete(event.midi)) {
              handlers.noteOff(event.midi);
            }
          } finally {
            resolve();
          }
        }, event.durationMs / speed);

        releaseTimers.add(task);
      });

      releaseTasks.push(releaseTask);
    }

    // Wait for all currently playing notes to finish.
    await Promise.all(releaseTasks);

    if (signal?.aborted) {
      throw createAbortError();
    }

    completed = true;
  } finally {
    signal?.removeEventListener("abort", handleAbort);

    if (!completed) {
      releaseAll();
    }
  }
}