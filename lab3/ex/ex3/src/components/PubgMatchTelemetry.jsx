import { useEffect, useState } from 'react';
import {
  PUBG_VN_SQUADS,
  fetchMatchTelemetry,
} from '../data/pubgVnSquads';

export default function PubgMatchTelemetry() {
  const [squadId, setSquadId] = useState('ces');

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

    return () => {
      controller.abort();
    };
  }, [squadId]);

  if (view.status === 'LOADING') {
    return (
      <section aria-busy="true">
        <p>Syncing KRAFTON Radar...</p>
      </section>
    );
  }

  if (view.status === 'ERROR') {
    return (
      <section role="alert">
        <p>Blue-Zone Link Lost: {view.error}</p>
      </section>
    );
  }

  if (view.status === 'SUCCESS') {
    return (
      <article aria-live="polite">
        <h3>{view.data.name}</h3>
        <p>Kills: {view.data.kills}</p>
      </article>
    );
  }

  return (
    <section>
      <label htmlFor="squad-selector">Select squad</label>

      <select
        id="squad-selector"
        value={squadId}
        onChange={(event) => setSquadId(event.target.value)}
      >
        {PUBG_VN_SQUADS.map((squad) => (
          <option key={squad.id} value={squad.id}>
            {squad.name}
          </option>
        ))}
      </select>
    </section>
  );
}