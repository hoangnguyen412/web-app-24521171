const FIRST_MIDI = 21; // A0
const LAST_MIDI = 108; // C8

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

// MIDI number -> frequency in Hz
export function midiToFreq(midi) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new RangeError("MIDI must be an integer from 0 to 127.");
  }

  return 440 * 2 ** ((midi - 69) / 12);
}

// Generate the 88 keys from A0 to C8.
export function generatePianoKeys() {
  const keys = [];

  for (let midi = FIRST_MIDI; midi <= LAST_MIDI; midi += 1) {
    const pitchClass = midi % 12;
    const octave = Math.floor(midi / 12) - 1;

    keys.push(
      Object.freeze({
        midi,
        noteName: `${NOTE_NAMES[pitchClass]}${octave}`,
        isBlack: BLACK_SEMITONES.has(pitchClass),
        freqHz: midiToFreq(midi),
      }),
    );
  }

  return keys;
}

// Generate once and reuse the same reference.
export const PIANO_KEYS = Object.freeze(generatePianoKeys());