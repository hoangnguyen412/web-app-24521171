import assert from "node:assert/strict";
import {
  sleep,
  playSequence,
} from "../src/utils/sequencePlayer.js";

// Test 1: Abort while a note is playing.
const controller1 = new AbortController();
const calls1 = [];

const playback1 = playSequence(
  [
    {
      midi: 60,
      freqHz: 261.63,
      deltaMs: 0,
      durationMs: 5000,
    },
    {
      midi: 64,
      freqHz: 329.63,
      deltaMs: 5000,
      durationMs: 100,
    },
  ],
  1,
  {
    noteOn(midi) {
      calls1.push(`on:${midi}`);
    },

    noteOff(midi) {
      calls1.push(`off:${midi}`);
    },
  },
  controller1.signal,
);

await sleep(30);
controller1.abort();

await assert.rejects(
  playback1,
  (error) => error.name === "AbortError",
);

assert.deepEqual(calls1, [
  "on:60",
  "off:60",
]);

console.log("PASS: active note is released on abort.");
console.log("PASS: scheduled note does not play after abort.");

// Test 2: Abort while waiting for the first note.
const controller2 = new AbortController();
const calls2 = [];

const playback2 = playSequence(
  [
    {
      midi: 69,
      freqHz: 440,
      deltaMs: 5000,
      durationMs: 500,
    },
  ],
  1,
  {
    noteOn(midi) {
      calls2.push(`on:${midi}`);
    },

    noteOff(midi) {
      calls2.push(`off:${midi}`);
    },
  },
  controller2.signal,
);

await sleep(30);
controller2.abort();

await assert.rejects(
  playback2,
  (error) => error.name === "AbortError",
);

assert.deepEqual(calls2, []);

console.log("PASS: pending first note is cancelled.");

// Test 3: No extra note starts after cancellation.
await sleep(50);

assert.deepEqual(calls1, [
  "on:60",
  "off:60",
]);

assert.deepEqual(calls2, []);

console.log("PASS: no notes start after cancellation.");
console.log("PASS: cancellation tests completed.");