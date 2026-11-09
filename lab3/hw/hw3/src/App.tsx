import { DropCard } from './components/DropCard';
import { drops as initialDrops } from './data/drops';
import { useOptimisticClaim } from './hooks/useOptimisticClaim';
import './App.css';

function App() {
  const {
    drops,
    claimingDropIds,
    claimStatus,
    claim,
  } = useOptimisticClaim(initialDrops);

  return (
    <main className="arena">
      <header className="arena__header">
        <span className="arena__eyebrow">
          KRAFTON × PUBG VIETNAM
        </span>

        <h1>PUBG VIETNAM AIRDROP ARENA</h1>

        <p>
          PUBG Vietnam Series Finals Ticket & G-Coin Contraband Crate
        </p>
      </header>

      <section
        className="arena__drops"
        aria-labelledby="drops-heading"
      >
        <div className="arena__section-heading">
          <div>
            <span className="arena__eyebrow">
              LIMITED REWARDS
            </span>

            <h2 id="drops-heading">Live Airdrop Drops</h2>
          </div>

          <span className="arena__live">
            <span className="arena__live-dot" />
            AIRDROP ARENA
          </span>
        </div>

        <div className="arena__grid">
          {drops.map((drop) => (
            <DropCard
              key={drop.id}
              drop={drop}
              isClaiming={claimingDropIds.includes(drop.id)}
              claimStatus={claimStatus}
              onClaim={claim}
            />
          ))}
        </div>
      </section>

      <footer className="arena__footer">
        KRAFTON × PUBG Vietnam Championship

        <span>Official Academic Project · HW3</span>
      </footer>
    </main>
  );
}

export default App;