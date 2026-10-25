import { useEffect, useState } from 'react';
import { PUBG_VN_SQUADS, fetchMatchTelemetry } from '../data/pubgVnSquads';
import './PubgMatchTelemetry.css';

export default function PubgMatchTelemetry() {
  const [squadId, setSquadId] = useState('ces');
  const [retryTick, setRetryTick] = useState(0);

  const [view, setView] = useState({
    status: 'IDLE',
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    setView({
      status: 'LOADING',
      data: null,
      error: null,
    });

    fetchMatchTelemetry(squadId, {
      signal: controller.signal,
    })
      .then((payload) => {
        setView({
          status: 'SUCCESS',
          data: payload,
          error: null,
        });
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }

        setView({
          status: 'ERROR',
          data: null,
          error: err.message,
        });
      });

    return () => controller.abort();
  }, [squadId, retryTick]);

  const selectedSquad = PUBG_VN_SQUADS.find(
    (squad) => squad.id === squadId
  );

  return (
    <main className="telemetry-page">
      <div className="telemetry-shell">
        <header className="telemetry-header">
          <div>
            <p className="telemetry-eyebrow">
              KRAFTON PUBG VIETNAM SERIES
            </p>

            <h1>PUBG MATCH TELEMETRY</h1>

            <p className="telemetry-subtitle">
              Live-style squad telemetry interface
            </p>
          </div>

          <div className="telemetry-badge">
            <span className="status-dot" />
            SIMULATED FEED
          </div>
        </header>

        <section className="squad-selector">
          <div className="section-heading">
            <div>
              <span className="section-number">01</span>
              <div>
                <p className="section-label">SQUAD SELECTOR</p>
                <h2>Choose a squad</h2>
              </div>
            </div>

            <span className="selected-label">
              ACTIVE: {selectedSquad?.id.toUpperCase()}
            </span>
          </div>

          <div className="squad-grid">
            {PUBG_VN_SQUADS.map((squad) => (
              <button
                key={squad.id}
                type="button"
                className={`squad-option ${
                  squadId === squad.id ? 'selected' : ''
                }`}
                onClick={() => setSquadId(squad.id)}
                aria-pressed={squadId === squad.id}
              >
                <span className="squad-code">
                  {squad.id.toUpperCase()}
                </span>

                <span className="squad-name">{squad.name}</span>

                <span className="squad-meta">
                  {squad.map} · {squad.phase}
                </span>

                <span className="squad-arrow">›</span>
              </button>
            ))}
          </div>
        </section>

        <section className="telemetry-section">
          <div className="section-heading">
            <div>
              <span className="section-number">02</span>
              <div>
                <p className="section-label">MATCH TELEMETRY</p>
                <h2>Current battlefield data</h2>
              </div>
            </div>

            <span className="selected-label">
              {selectedSquad?.name}
            </span>
          </div>

          <div className="telemetry-stage">
            {view.status === 'IDLE' && (
              <section className="state-card idle-card">
                <span className="state-mark">01</span>

                <div>
                  <p className="state-label">TELEMETRY SYSTEM</p>
                  <h3>Ready to connect</h3>
                </div>
              </section>
            )}

            {view.status === 'LOADING' && (
              <section
                className="state-card loading-card"
                aria-busy="true"
                aria-label="Loading match telemetry"
              >
                <div className="loading-header">
                  <span className="state-label">
                    SATELLITE TELEMETRY
                  </span>

                  <span className="loading-status">
                    CONNECTING...
                  </span>
                </div>

                <div className="loading-content">
                  <div className="blue-zone-loader">
                    <span />
                  </div>

                  <div className="skeleton-content">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                </div>

                <div className="loading-bar">
                  <span />
                </div>
              </section>
            )}

            {view.status === 'ERROR' && (
              <section className="state-card error-card" role="alert">
                <div className="error-icon">!</div>

                <div className="error-content">
                  <p className="state-label">TELEMETRY ERROR</p>

                  <h3>Blue-Zone Link Lost</h3>

                  <p className="error-message">
                    {view.error || 'Satellite telemetry request failed.'}
                  </p>

                  <button
                    type="button"
                    className="retry-button"
                    onClick={() => setRetryTick((tick) => tick + 1)}
                  >
                    Reconnect Satellite (Retry)
                  </button>
                </div>
              </section>
            )}

            {view.status === 'SUCCESS' && view.data && (
              <article
                className="state-card success-card"
                aria-live="polite"
              >
                <div className="result-header">
                  <div>
                    <p className="state-label">TELEMETRY ONLINE</p>
                    <h3>{view.data.name}</h3>
                  </div>

                  <span className="result-status">
                    CONNECTED
                  </span>
                </div>

                <div className="match-context">
                  <div>
                    <span>MAP</span>
                    <strong>{view.data.map}</strong>
                  </div>

                  <div>
                    <span>PHASE</span>
                    <strong>{view.data.phase}</strong>
                  </div>

                  <div>
                    <span>STATUS</span>
                    <strong>{view.data.status}</strong>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat">
                    <span>ALIVE</span>
                    <strong>{view.data.alive}</strong>
                    <small>SQUAD MEMBERS</small>
                  </div>

                  <div className="stat">
                    <span>KILLS</span>
                    <strong>{view.data.kills}</strong>
                    <small>CONFIRMED</small>
                  </div>

                  <div className="stat highlight">
                    <span>WWCD PROBABILITY</span>
                    <strong>
                      {view.data.wwcdProb ?? view.data.wwcProb}
                    </strong>

                    <div className="probability-bar">
                      <span
                        style={{
                          width:
                            view.data.wwcdProb ??
                            view.data.wwcProb,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>

        <footer className="telemetry-footer">
          <span>PVS / EXERCISE 03</span>
          <span>EDUCATIONAL SIMULATION</span>
        </footer>
      </div>
    </main>
  );
}