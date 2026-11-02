import assert from "node:assert/strict";

import { PolyphonicSynth } from "../src/audio/PolyphonicSynth.js";
import { midiToFreq } from "../src/data/pianoKeys.js";

class FakeAudioParam {
  constructor(initialValue = 0) {
    this.value = initialValue;
    this.events = [];
  }

  cancelScheduledValues(time) {
    this.events.push({
      type: "cancel",
      time,
    });
  }

  setValueAtTime(value, time) {
    this.value = value;

    this.events.push({
      type: "set",
      value,
      time,
    });
  }

  exponentialRampToValueAtTime(value, time) {
    this.value = value;

    this.events.push({
      type: "ramp",
      value,
      time,
    });
  }
}

class FakeOscillator {
  constructor() {
    this.frequency = new FakeAudioParam();
    this.stopTimes = [];
    this.started = false;
    this.disconnected = false;
    this.onended = null;
  }

  connect() {
    return this;
  }

  disconnect() {
    this.disconnected = true;
  }

  start(time) {
    this.started = true;
    this.startTime = time;
  }

  stop(time) {
    this.stopTimes.push(time);
  }
}

class FakeGain {
  constructor() {
    this.gain = new FakeAudioParam(1);
    this.disconnected = false;
  }

  connect() {
    return this;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeAudioContext {
  constructor() {
    this.state = "running";
    this.currentTime = 10;
    this.destination = {};

    this.oscillators = [];
    this.gains = [];
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);

    return oscillator;
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);

    return gain;
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

// Mock browser AudioContext for Node.js testing.
globalThis.window = {
  AudioContext: FakeAudioContext,
};

const synth = new PolyphonicSynth(8);

// Test 1: Eight simultaneous voices.
for (let midi = 21; midi <= 28; midi += 1) {
  synth.noteOn(midi, midiToFreq(midi));
}

assert.equal(synth.voices.size, 8);

console.log("PASS: synth supports 8 active voices.");

// Test 2: Duplicate MIDI must not create another oscillator.
const oscillatorCount = synth.ctx.oscillators.length;

const duplicateResult = synth.noteOn(22, midiToFreq(22));

assert.equal(duplicateResult, null);
assert.equal(synth.ctx.oscillators.length, oscillatorCount);
assert.equal(synth.voices.size, 8);

console.log("PASS: duplicate MIDI does not create another voice.");

// Test 3: Ninth note steals the oldest voice.
const firstOscillator = synth.ctx.oscillators[0];
const firstGain = synth.ctx.gains[0];

const stolenMidi = synth.noteOn(29, midiToFreq(29));

assert.equal(stolenMidi, 21);
assert.equal(synth.voices.size, 8);

assert.deepEqual(
  [...synth.voices.keys()],
  [22, 23, 24, 25, 26, 27, 28, 29],
);

assert.ok(
  Math.abs(firstOscillator.stopTimes[0] - 10.04) < 1e-9,
);

const rampEvent = firstGain.gain.events.find(
  (event) => event.type === "ramp",
);

assert.ok(rampEvent);
assert.equal(rampEvent.value, 0.0001);
assert.ok(Math.abs(rampEvent.time - 10.04) < 1e-9);

console.log("PASS: ninth note steals the oldest voice.");
console.log("PASS: release ramp completes after 40 ms.");

// Test 4: noteOff removes the active voice.
assert.equal(synth.noteOff(22), true);
assert.equal(synth.voices.has(22), false);
assert.equal(synth.voices.size, 7);

console.log("PASS: noteOff removes the voice from the Map.");

// Test 5: stopAll clears every active voice.
synth.stopAll();

assert.equal(synth.voices.size, 0);

console.log("PASS: stopAll releases every voice.");

// Test 6: dispose closes the AudioContext.
const context = synth.ctx;

synth.dispose();

assert.equal(synth.voices.size, 0);
assert.equal(synth.ctx, null);
assert.equal(context.state, "closed");

console.log("PASS: dispose closes AudioContext.");
console.log("PASS: all PolyphonicSynth tests completed.");