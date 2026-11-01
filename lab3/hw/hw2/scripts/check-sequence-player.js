import assert from "node:assert/strict";

import {
  sleep,
  playSequence,
} from "../src/utils/sequencePlayer.js";

// Test 1: sleep completes normally.
await sleep(10);

console.log("PASS: sleep completes normally.");

// Test 2: sleep can be aborted.
const sleepController = new AbortController();

const sleepPromise = sleep(1000, sleepController.signal);

sleepController.abort();

await assert.rejects(
  sleepPromise,
  (error) => error.name === "AbortError",
);

console.log("PASS: sleep supports AbortController.");

// Test 3: overlapping notes.
// C5 must start before A4 finishes.
const calls = [];

const events = [
  {
    midi: 69,
    freqHz: 440,
    deltaMs: 0,
    durationMs: 500,
  },
  {
    midi: 72,
    freqHz: 523.25,
    deltaMs: 40,
    durationMs: 40,
  },
];

await playSequence(events, 1, {
  noteOn(midi) {
    calls.push(`on:${midi}`);
  },

  noteOff(midi) {
    calls.push(`off:${midi}`);
  },
});

assert.deepEqual(calls, [
  "on:69",
  "on:72",
  "off:72",
  "off:69",
]);

console.log("PASS: overlapping notes play independently.");

// Test 4: abort releases active notes and cancels pending events.
const playbackController = new AbortController();
const abortCalls = [];

const playbackPromise = playSequence(
  [
    {
      midi: 60,
      freqHz: 261.63,
      deltaMs: 0,
      durationMs: 2000,
    },
    {
      midi: 64,
      freqHz: 329.63,
      deltaMs: 2000,
      durationMs: 100,
    },
  ],
  1,
  {
    noteOn(midi) {
      abortCalls.push(`on:${midi}`);
    },

    noteOff(midi) {
      abortCalls.push(`off:${midi}`);
    },
  },
  playbackController.signal,
);

await sleep(30);
playbackController.abort();

await assert.rejects(
  playbackPromise,
  (error) => error.name === "AbortError",
);

assert.deepEqual(abortCalls, [
  "on:60",
  "off:60",
]);

console.log("PASS: aborted playback releases active notes.");
console.log("PASS: pending notes do not start after abort.");