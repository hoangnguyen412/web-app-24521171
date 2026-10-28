import { useCallback, useRef, useState } from "react";
import { PIANO_KEYS } from "./data/pianoKeys.js";
import { PianoKey } from "./components/PianoKey.jsx";
import { PolyphonicSynth } from "./audio/PolyphonicSynth.js";

const whiteKeys = PIANO_KEYS.filter((key) => !key.isBlack);
const blackKeys = PIANO_KEYS.filter((key) => key.isBlack);

const KEY_BY_MIDI = new Map(
  PIANO_KEYS.map((key) => [key.midi, key]),
);

const a0 = PIANO_KEYS[0];
const a4 = KEY_BY_MIDI.get(69);
const c8 = PIANO_KEYS[PIANO_KEYS.length - 1];

const checks = [
  {
    label: "Total keys",
    detail: `${PIANO_KEYS.length} keys; expected 88`,
    passed: PIANO_KEYS.length === 88,
  },
  {
    label: "White keys",
    detail: `${whiteKeys.length} keys; expected 52`,
    passed: whiteKeys.length === 52,
  },
  {
    label: "Black keys",
    detail: `${blackKeys.length} keys; expected 36`,
    passed: blackKeys.length === 36,
  },
  {
    label: "First key",
    detail: `${a0.noteName}, MIDI ${a0.midi}`,
    passed: a0.noteName === "A0" && a0.midi === 21,
  },
  {
    label: "A4 reference",
    detail: `${a4.freqHz} Hz`,
    passed: Math.abs(a4.freqHz - 440) < 1e-9,
  },
  {
    label: "Last key",
    detail: `${c8.noteName}, MIDI ${c8.midi}`,
    passed: c8.noteName === "C8" && c8.midi === 108,
  },
];

export default function App() {
  const [pressed, setPressed] = useState(() => new Set());

  // The synth instance remains stable across component renders.
  const synthRef = useRef(null);

  if (synthRef.current === null) {
    synthRef.current = new PolyphonicSynth(8);
  }

  const handleNoteOn = useCallback((midi) => {
    const key = KEY_BY_MIDI.get(midi);
    const synth = synthRef.current;

    if (!key || !synth) {
      return;
    }

    const stolenMidi = synth.noteOn(midi, key.freqHz);

    setPressed((previous) => {
      if (previous.has(midi) && stolenMidi === null) {
        return previous;
      }

      const next = new Set(previous);

      if (stolenMidi !== null) {
        next.delete(stolenMidi);
      }

      next.add(midi);

      return next;
    });
  }, []);

  const handleNoteOff = useCallback((midi) => {
    synthRef.current?.noteOff(midi);

    setPressed((previous) => {
      if (!previous.has(midi)) {
        return previous;
      }

      const next = new Set(previous);
      next.delete(midi);

      return next;
    });
  }, []);

  const allPassed = checks.every((check) => check.passed);

  const pressedNoteNames = PIANO_KEYS
    .filter((key) => pressed.has(key.midi))
    .map((key) => key.noteName);

  return (
    <main className="app">
      <header className="page-header">
        <p className="eyebrow">REACT 19 · HOMEWORK 2</p>
        <h1>88-Key Piano</h1>
        <p className="subtitle">
          Phase D — Polyphonic Synth and FIFO Voice Stealing
        </p>
      </header>

      <section className="summary" aria-label="Piano summary">
        <article className="summary-card">
          <span>Total keys</span>
          <strong>{PIANO_KEYS.length}</strong>
        </article>

        <article className="summary-card">
          <span>White keys</span>
          <strong>{whiteKeys.length}</strong>
        </article>

        <article className="summary-card">
          <span>Black keys</span>
          <strong>{blackKeys.length}</strong>
        </article>
      </section>

      <section className="piano-section" aria-labelledby="piano-heading">
        <div className="section-heading">
          <div>
            <h2 id="piano-heading">Piano keyboard</h2>
            <p>Hold keys to play chords, then release to stop notes.</p>
          </div>

          <span className="keyboard-count">A0 — C8</span>
        </div>

        <div className="piano-scroll">
          <div className="piano-track" role="group" aria-label="88 piano keys">
            {PIANO_KEYS.map((key) => (
              <PianoKey
                key={key.midi}
                midi={key.midi}
                noteName={key.noteName}
                isBlack={key.isBlack}
                isPressed={pressed.has(key.midi)}
                onNoteOn={handleNoteOn}
                onNoteOff={handleNoteOff}
              />
            ))}
          </div>
        </div>

        <p className="piano-hint" aria-live="polite">
          Pressed ({pressed.size}):{" "}
          {pressedNoteNames.length > 0
            ? pressedNoteNames.join(", ")
            : "None"}
        </p>
      </section>

      <section
        className="verification"
        aria-labelledby="verification-heading"
      >
        <div className="section-heading">
          <div>
            <h2 id="verification-heading">Key generation verification</h2>
            <p>Confirm Phase A data remains correct.</p>
          </div>

          <span
            className={`status ${
              allPassed ? "status-pass" : "status-fail"
            }`}
            role="status"
          >
            {allPassed ? "ALL PASSED" : "CHECK FAILED"}
          </span>
        </div>

        <ul className="check-list">
          {checks.map((check) => (
            <li
              key={check.label}
              className={`check-item ${
                check.passed ? "check-pass" : "check-fail"
              }`}
            >
              <span className="check-icon" aria-hidden="true">
                {check.passed ? "✓" : "✗"}
              </span>

              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}