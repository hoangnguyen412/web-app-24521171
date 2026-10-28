export class PolyphonicSynth {
  constructor(maxVoices = 8) {
    if (!Number.isInteger(maxVoices) || maxVoices < 1) {
      throw new RangeError("maxVoices must be a positive integer.");
    }

    this.ctx = null;
    this.maxVoices = maxVoices;

    // Map preserves insertion order, which we use for FIFO stealing.
    // midi -> { osc, gain }
    this.voices = new Map();
  }

  getContext() {
    if (
      !this.ctx ||
      this.ctx.state === "closed"
    ) {
      if (
        typeof window === "undefined" ||
        typeof window.AudioContext !== "function"
      ) {
        throw new Error("Web Audio API is not supported by this browser.");
      }

      this.ctx = new window.AudioContext();
    }

    // AudioContext may initially be suspended by the browser.
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch((error) => {
        console.error("Unable to resume AudioContext:", error);
      });
    }

    return this.ctx;
  }

  noteOn(midi, freqHz) {
    if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
      throw new RangeError("midi must be an integer from 0 to 127.");
    }

    if (!Number.isFinite(freqHz) || freqHz <= 0) {
      throw new RangeError("freqHz must be a positive finite number.");
    }

    // Do not create a second voice for the same MIDI note.
    if (this.voices.has(midi)) {
      return null;
    }

    const ctx = this.getContext();
    let stolenMidi = null;

    // Steal the oldest active voice when the pool is full.
    if (this.voices.size >= this.maxVoices) {
      const oldestMidi = this.voices.keys().next().value;

      if (oldestMidi !== undefined) {
        this.noteOff(oldestMidi);
        stolenMidi = oldestMidi;
      }
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freqHz, now);

    gain.gain.setValueAtTime(0.2, now);

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Release Web Audio node references when the oscillator ends.
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(now);

    this.voices.set(midi, { osc, gain });

    // The UI uses this to clear the stolen key's pressed state.
    return stolenMidi;
  }

  noteOff(midi) {
    const voice = this.voices.get(midi);

    if (!voice) {
      return false;
    }

    // Remove immediately so the Map tracks active voices, not release tails.
    this.voices.delete(midi);

    const ctx = this.ctx;

    if (!ctx || ctx.state === "closed") {
      voice.osc.disconnect();
      voice.gain.disconnect();
      return true;
    }

    const now = ctx.currentTime;
    const releaseEnd = now + 0.04;

    // Cancel previous automation and start the release from a positive gain.
    voice.gain.gain.cancelScheduledValues(now);

    voice.gain.gain.setValueAtTime(
      Math.max(voice.gain.gain.value, 0.0001),
      now,
    );

    voice.gain.gain.exponentialRampToValueAtTime(
      0.0001,
      releaseEnd,
    );

    // Do not stop immediately; let the 40 ms release finish.
    voice.osc.stop(releaseEnd);

    return true;
  }

  stopAll() {
    // Use the same release envelope for every active voice.
    for (const midi of [...this.voices.keys()]) {
      this.noteOff(midi);
    }
  }

  dispose() {
    const ctx = this.ctx;

    // Force-stop all nodes during final disposal.
    for (const voice of this.voices.values()) {
      try {
        if (ctx && ctx.state !== "closed") {
          const now = ctx.currentTime;

          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(0.0001, now);
          voice.osc.stop(now);
        }
      } catch {
        // The oscillator may already have stopped.
      }

      voice.osc.disconnect();
      voice.gain.disconnect();
    }

    this.voices.clear();
    this.ctx = null;

    if (ctx && ctx.state !== "closed") {
      void ctx.close().catch((error) => {
        console.error("Unable to close AudioContext:", error);
      });
    }
  }
}