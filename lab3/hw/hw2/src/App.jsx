import { useCallback, useRef, useState } from "react";
import { PIANO_KEYS } from "./data/pianoKeys.js";
import { PianoKey } from "./components/PianoKey.jsx";
import { PolyphonicSynth } from "./audio/PolyphonicSynth.js";
import { FifoQueue } from "./utils/FifoQueue.js";

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

// Finalize one recorded note without changing its original queue position.
function finalizeRecordedNote(activeRecording, midi, endMs) {
  const active = activeRecording.get(midi);

  if (!active) {
    return false;
  }

  active.event.durationMs = Math.max(
    0,
    Math.round(endMs - active.startedAt),
  );

  activeRecording.delete(midi);
  return true;
}

export default function App() {
  const [pressed, setPressed] = useState(() => new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingEvents, setRecordingEvents] = useState([]);

  const synthRef = useRef(null);

  if (synthRef.current === null) {
    synthRef.current = new PolyphonicSynth(8);
  }

  // Recording infrastructure remains stable across React renders.
  const recordingQueueRef = useRef(null);
  if (recordingQueueRef.current === null) {
    recordingQueueRef.current = new FifoQueue();
  }

  // MIDI -> { event, startedAt }
  const activeRecordingRef = useRef(new Map());
  const isRecordingRef = useRef(false);
  const recordingStartRef = useRef(null);
  const lastNoteStartRef = useRef(null);

  const handleNoteOn = useCallback((midi) => {
    const key = KEY_BY_MIDI.get(midi);
    const synth = synthRef.current;

    if (!key || !synth || synth.voices.has(midi)) {
      return;
    }

    const stolenMidi = synth.noteOn(midi, key.freqHz);
    const startedAt = performance.now();

    // If the 9th voice steals an active note, finalize its recording.
    if (stolenMidi !== null && isRecordingRef.current) {
      finalizeRecordedNote(
        activeRecordingRef.current,
        stolenMidi,
        startedAt,
      );
    }

    if (isRecordingRef.current) {
      const previousStart =
        lastNoteStartRef.current ??
        recordingStartRef.current ??
        startedAt;

      const event = {
        midi,
        freqHz: key.freqHz,
        durationMs: 0,
        deltaMs: Math.max(
          0,
          Math.round(startedAt - previousStart),
        ),
      };

      recordingQueueRef.current.enqueue(event);

      activeRecordingRef.current.set(midi, {
        event,
        startedAt,
      });

      lastNoteStartRef.current = startedAt;

      // Refresh the displayed queue, preserving note-on order.
      setRecordingEvents(recordingQueueRef.current.toArray());
    }

    setPressed((previous) => {
      const next = new Set(previous);

      if (stolenMidi !== null) {
        next.delete(stolenMidi);
      }

      next.add(midi);
      return next;
    });
  }, []);

  const handleNoteOff = useCallback((midi) => {
    const now = performance.now();

    const finalized = isRecordingRef.current
      ? finalizeRecordedNote(
          activeRecordingRef.current,
          midi,
          now,
        )
      : false;

    synthRef.current?.noteOff(midi);

    setPressed((previous) => {
      if (!previous.has(midi)) {
        return previous;
      }

      const next = new Set(previous);
      next.delete(midi);
      return next;
    });

    if (finalized) {
      setRecordingEvents(recordingQueueRef.current.toArray());
    }
  }, []);

  const startRecording = useCallback(() => {
    const queue = recordingQueueRef.current;

    // Each new recording replaces the previous one.
    queue.clear();
    activeRecordingRef.current.clear();

    const now = performance.now();

    recordingStartRef.current = now;
    lastNoteStartRef.current = now;
    isRecordingRef.current = true;

    setRecordingEvents([]);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) {
      return;
    }

    const stoppedAt = performance.now();

    // Finalize every note still held when recording stops.
    for (const midi of [...activeRecordingRef.current.keys()]) {
      finalizeRecordedNote(
        activeRecordingRef.current,
        midi,
        stoppedAt,
      );
    }

    activeRecordingRef.current.clear();
    isRecordingRef.current = false;

    setIsRecording(false);
    setRecordingEvents(recordingQueueRef.current.toArray());
  }, []);

  const pressedNoteNames = PIANO_KEYS
    .filter((key) => pressed.has(key.midi))
    .map((key) => key.noteName);

  const allPassed = checks.every((check) => check.passed);

  return (
    <main className="app">
      <header className="page-header">
        <p className="eyebrow">REACT 19 · HOMEWORK 2</p>
        <h1>88-Key Piano</h1>
        <p className="subtitle">
          Phase E — FIFO Recording
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
            <p>Hold the keys to play and record notes.</p>
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

      <section className="recording-section" aria-labelledby="recording-heading">
        <div className="section-heading">
          <div>
            <h2 id="recording-heading">Recording</h2>
            <p>
              Delta is measured between note starts. The first delta is
              measured from when recording begins.
            </p>
          </div>
        </div>

        <div className="recording-controls">
          <button
            type="button"
            className="record-button"
            onClick={startRecording}
            disabled={isRecording}
          >
            Record
          </button>

          <button
            type="button"
            className="stop-recording-button"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop Recording
          </button>

          <span className="recording-status" role="status" aria-live="polite">
            {isRecording ? "Recording..." : "Not recording"}
            {" · "}
            {recordingEvents.length} events
          </span>
        </div>

        <p className="recording-note">
          Held notes are finalized when released or when Stop Recording is
          clicked.
        </p>

        {recordingEvents.length === 0 ? (
          <p className="empty-recording">No events recorded yet.</p>
        ) : (
          <div className="recording-table-scroll">
            <table className="recording-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Note</th>
                  <th>Frequency</th>
                  <th>Delta</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {recordingEvents.map((event, index) => (
                  <tr key={`${event.midi}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      {KEY_BY_MIDI.get(event.midi)?.noteName ?? event.midi}
                    </td>
                    <td>{event.freqHz.toFixed(2)} Hz</td>
                    <td>{event.deltaMs} ms</td>
                    <td>{event.durationMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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