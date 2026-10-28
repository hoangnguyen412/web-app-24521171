import { PIANO_KEYS } from "./data/pianoKeys.js";

const whiteKeys = PIANO_KEYS.filter((key) => !key.isBlack);
const blackKeys = PIANO_KEYS.filter((key) => key.isBlack);

const a0 = PIANO_KEYS[0];
const a4 = PIANO_KEYS.find((key) => key.midi === 69);
const c8 = PIANO_KEYS[PIANO_KEYS.length - 1];

const checks = [
  {
    label: "88 keys generated",
    detail: `${PIANO_KEYS.length} keys`,
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
    label: "A4 reference frequency",
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
  const allPassed = checks.every((check) => check.passed);

  return (
    <main className="app">
      <header className="page-header">
        <p className="eyebrow">REACT 19 · HOMEWORK 2</p>
        <h1>88-Key Piano</h1>
        <p className="subtitle">
          Phase A — Setup and Algorithmic Key Generation
        </p>
      </header>

      <section className="summary" aria-label="Key generation summary">
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

      <section className="verification">
        <div className="section-heading">
          <div>
            <h2>Phase A verification</h2>
            <p>Check the generated data before continuing.</p>
          </div>

          <span
            className={`status ${allPassed ? "status-pass" : "status-fail"}`}
            role="status"
            aria-live="polite"
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