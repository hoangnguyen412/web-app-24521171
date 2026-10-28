import assert from "node:assert/strict";

import {
  PIANO_KEYS,
  midiToFreq,
  generatePianoKeys,
} from "../src/data/pianoKeys.js";

const whiteKeys = PIANO_KEYS.filter((key) => !key.isBlack);
const blackKeys = PIANO_KEYS.filter((key) => key.isBlack);

const a0 = PIANO_KEYS[0];
const a4 = PIANO_KEYS.find((key) => key.midi === 69);
const c8 = PIANO_KEYS[PIANO_KEYS.length - 1];

assert.equal(PIANO_KEYS.length, 88, "Must generate 88 keys.");
assert.equal(whiteKeys.length, 52, "Must generate 52 white keys.");
assert.equal(blackKeys.length, 36, "Must generate 36 black keys.");

assert.equal(a0.midi, 21);
assert.equal(a0.noteName, "A0");

assert.equal(a4.midi, 69);
assert.equal(a4.noteName, "A4");
assert.equal(midiToFreq(69), 440);
assert.ok(Math.abs(a4.freqHz - 440) < 1e-9);

assert.equal(c8.midi, 108);
assert.equal(c8.noteName, "C8");

assert.ok(
  PIANO_KEYS.every(
    (key) => Number.isFinite(key.freqHz) && key.freqHz > 0,
  ),
  "Every key must have a valid frequency.",
);

assert.deepEqual(PIANO_KEYS, generatePianoKeys());
assert.ok(Object.isFrozen(PIANO_KEYS));
assert.ok(Object.isFrozen(PIANO_KEYS[0]));

console.log("PASS: 88 keys generated.");
console.log("PASS: 52 white keys and 36 black keys.");
console.log("PASS: A0, A4 = 440 Hz, and C8 are correct.");
console.log("PASS: Frequencies and immutable key data are valid.");