export class DrumAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.timeDomainData = null;

    this.activeSources = new Set();
    this.activeNodes = new Set();
  }

  // Create AudioContext lazily, after the first user interaction.
  ensureContext() {
    if (this.ctx?.state === 'closed') {
      this.ctx = null;
      this.masterGain = null;
      this.analyser = null;
      this.timeDomainData = null;
    }

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported by this browser.');
      }

      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        0.65,
        this.ctx.currentTime
      );

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.7;

      this.timeDomainData = new Float32Array(
        this.analyser.fftSize
      );

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }

    return this.ctx;
  }

  trackSource(source, nodes) {
    this.activeSources.add(source);

    for (const node of nodes) {
      this.activeNodes.add(node);
    }

    source.onended = () => {
      source.onended = null;
      this.activeSources.delete(source);

      for (const node of nodes) {
        this.activeNodes.delete(node);

        try {
          node.disconnect();
        } catch {
          // A node may already have been disconnected.
        }
      }
    };
  }

  playTone(startHz, endHz, duration, peak = 0.5) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    osc.frequency.setValueAtTime(startHz, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, endHz),
      now + duration
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      peak,
      now + 0.005
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.trackSource(osc, [osc, gain]);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playNoise(duration, cutoffHz, peak = 0.3) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const bufferLength = Math.max(
      1,
      Math.ceil(ctx.sampleRate * duration)
    );

    const buffer = ctx.createBuffer(
      1,
      bufferLength,
      ctx.sampleRate
    );

    const channel = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i += 1) {
      channel[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoffHz, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      peak,
      now + 0.004
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    this.trackSource(source, [source, filter, gain]);

    source.start(now);
    source.stop(now + duration + 0.02);
  }

  // IDs must match the pad definitions in the React application.
  play(padId) {
    this.ensureContext();

    switch (padId) {
      case 'kick':
        this.playTone(150, 42, 0.22, 0.9);
        break;

      case 'snare':
        this.playNoise(0.16, 1200, 0.48);
        this.playTone(190, 110, 0.09, 0.2);
        break;

      case 'closed-hat':
        this.playNoise(0.055, 7000, 0.22);
        break;

      case 'open-hat':
        this.playNoise(0.32, 6000, 0.2);
        break;

      case 'tom':
        this.playTone(190, 75, 0.2, 0.55);
        break;

      case 'clap':
        this.playNoise(0.12, 900, 0.45);
        break;

      case 'cymbal':
        this.playNoise(0.5, 4500, 0.2);
        break;

      default:
        return false;
    }

    return true;
  }

  // Returns the synthesized audio level in dBFS.
  // Silence is reported as -100 dBFS.
  getLevelDb() {
    if (!this.analyser || !this.timeDomainData) {
      return -100;
    }

    this.analyser.getFloatTimeDomainData(
      this.timeDomainData
    );

    let sumSquares = 0;

    for (const sample of this.timeDomainData) {
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(
      sumSquares / this.timeDomainData.length
    );

    if (rms < 1e-5) {
      return -100;
    }

    const decibels = 20 * Math.log10(rms);

    return Math.max(-100, Math.min(0, decibels));
  }

  // Must be called when the owning React component unmounts.
  dispose() {
    for (const source of this.activeSources) {
      source.onended = null;

      try {
        source.stop();
      } catch {
        // The source may already have stopped.
      }
    }

    this.activeSources.clear();

    for (const node of this.activeNodes) {
      try {
        node.disconnect();
      } catch {
        // The node may already have been disconnected.
      }
    }

    this.activeNodes.clear();

    const ctx = this.ctx;

    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.timeDomainData = null;

    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined);
    }
  }
}