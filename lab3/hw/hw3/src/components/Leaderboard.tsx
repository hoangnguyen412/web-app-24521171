import { useState } from 'react';
import { standings } from '../data/standings';

type SortKey = 'wwcdCount' | 'placementPts' | 'killPts';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'wwcdCount', label: 'WWCD' },
  { value: 'placementPts', label: 'Placement Points' },
  { value: 'killPts', label: 'Kill Points' },
];

export function Leaderboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('wwcdCount');

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleStandings = standings
    .filter((squad) =>
      squad.squadName.toLowerCase().includes(normalizedSearch),
    )
    .toSorted((a, b) => b[sortKey] - a[sortKey]);

  return (
    <section
      className="leaderboard"
      aria-labelledby="leaderboard-heading"
    >
      <div className="leaderboard__heading">
        <div>
          <span className="arena__eyebrow">COMPETITIVE RANKING</span>
          <h2 id="leaderboard-heading">Squad Leaderboard</h2>
        </div>

        <span className="leaderboard__count">
          {visibleStandings.length} / {standings.length} SQUADS
        </span>
      </div>

      <div className="leaderboard__controls">
        <div className="leaderboard__field">
          <label htmlFor="squad-search">Search squad</label>
          <input
            id="squad-search"
            type="text"
            placeholder="Enter squad name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="leaderboard__field">
          <label htmlFor="leaderboard-sort">Sort by</label>
          <select
            id="leaderboard-sort"
            value={sortKey}
            onChange={(event) =>
              setSortKey(event.target.value as SortKey)
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="leaderboard__table-wrapper">
        <table className="leaderboard__table">
          <thead>
            <tr>
              <th scope="col">RANK</th>
              <th scope="col">SQUAD</th>
              <th scope="col">WWCD</th>
              <th scope="col">PLACEMENT</th>
              <th scope="col">KILL POINTS</th>
            </tr>
          </thead>

          <tbody>
            {visibleStandings.map((squad, index) => (
              <tr key={squad.squadId}>
                <td className="leaderboard__rank">
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td className="leaderboard__squad">
                  {squad.squadName}
                </td>
                <td>{squad.wwcdCount}</td>
                <td>{squad.placementPts}</td>
                <td>{squad.killPts}</td>
              </tr>
            ))}

            {visibleStandings.length === 0 && (
              <tr>
                <td colSpan={5} className="leaderboard__empty">
                  No squads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}