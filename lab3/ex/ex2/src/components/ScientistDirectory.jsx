import { useId, useState } from 'react';

export const SMART_PEOPLE = [
  { id: 'sp-1', name: 'Johann Goethe', age: 82, iq: 210 },
  { id: 'sp-2', name: 'Albert Einstein', age: 76, iq: 205 },
  { id: 'sp-3', name: 'Leonardo da Vinci', age: 67, iq: 180 },
  { id: 'sp-4', name: 'Isaac Newton', age: 84, iq: 190 },
  { id: 'sp-5', name: 'James Maxwell', age: 48, iq: 190 },
  { id: 'sp-6', name: 'William Sidis', age: 46, iq: 200 },
  { id: 'sp-7', name: 'Dang Hoang Nguyen', age: 20, iq: 115 },
];

const styles = {
  page: {
    minHeight: '100vh',
    padding: '40px 24px',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 'clamp(28px, 4vw, 42px)',
    color: '#f8fafc',
  },
  subtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '16px',
    lineHeight: 1.6,
  },
  panel: {
    padding: '24px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    marginBottom: '24px',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '18px',
    alignItems: 'end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  input: {
    width: '100%',
    minHeight: '42px',
    padding: '10px 12px',
    border: '1px solid #475569',
    borderRadius: '8px',
    background: '#0f172a',
    color: '#f8fafc',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '22px',
  },
  count: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  resetButton: {
    padding: '10px 16px',
    border: '1px solid #818cf8',
    borderRadius: '8px',
    background: '#4f46e5',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sectionTitle: {
    margin: '0 0 18px',
    fontSize: '20px',
    color: '#f8fafc',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '18px',
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
  card: {
    minWidth: 0,
    padding: '22px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '14px',
    boxSizing: 'border-box',
  },
  personName: {
    margin: '0 0 18px',
    fontSize: '19px',
    lineHeight: 1.4,
    overflowWrap: 'anywhere',
    color: '#f8fafc',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '0 0 20px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
  detailLabel: {
    color: '#94a3b8',
  },
  detailValue: {
    color: '#e2e8f0',
    fontWeight: 600,
    textAlign: 'right',
  },
  deleteButton: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #f87171',
    borderRadius: '8px',
    background: 'transparent',
    color: '#fca5a5',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: {
    padding: '36px 20px',
    textAlign: 'center',
    color: '#94a3b8',
    background: '#1e293b',
    border: '1px dashed #475569',
    borderRadius: '12px',
  },
};

export default function ScientistDirectory({
  initialData = SMART_PEOPLE,
}) {
  const nameId = useId();
  const iqId = useId();
  const sortId = useId();

  const [people, setPeople] = useState(() => [...initialData]);
  const [query, setQuery] = useState('');
  const [minIq, setMinIq] = useState(0);
  const [sortBy, setSortBy] = useState('iq-desc');

  const normalizedQuery = query.trim().toLowerCase();

  const visiblePeople = people
    .filter(
      (person) =>
        person.name.toLowerCase().includes(normalizedQuery) &&
        person.iq >= minIq,
    )
    .toSorted((a, b) =>
      sortBy === 'iq-desc'
        ? b.iq - a.iq
        : a.age - b.age,
    );

  function handleDelete(id) {
    setPeople((previousPeople) =>
      previousPeople.filter((person) => person.id !== id),
    );
  }

  function handleReset() {
    setPeople([...initialData]);
    setQuery('');
    setMinIq(0);
    setSortBy('iq-desc');
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>
            Scientist &amp; Pioneer Directory
          </h1>
          <p style={styles.subtitle}>
            Explore scientists and pioneers by name, IQ, and age.
          </p>
        </header>

        <section
          aria-label="Directory filters"
          style={styles.panel}
        >
          <form
            role="search"
            onSubmit={(event) => event.preventDefault()}
            style={styles.form}
          >
            <div style={styles.field}>
              <label htmlFor={nameId} style={styles.label}>
                Search by name
              </label>
              <input
                id={nameId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter a name..."
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor={iqId} style={styles.label}>
                Minimum IQ
              </label>
              <input
                id={iqId}
                type="number"
                min={0}
                step={1}
                value={minIq}
                onChange={(event) => {
                  const value = event.target.valueAsNumber;
                  setMinIq(
                    Number.isNaN(value) ? 0 : Math.max(0, value),
                  );
                }}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor={sortId} style={styles.label}>
                Sort by
              </label>
              <select
                id={sortId}
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                style={styles.input}
              >
                <option value="iq-desc">IQ: High to Low</option>
                <option value="age-asc">
                  Age: Youngest to Oldest
                </option>
              </select>
            </div>
          </form>

          <div style={styles.toolbar}>
            <output
              role="status"
              aria-live="polite"
              style={styles.count}
            >
              Found {visiblePeople.length} pioneers
            </output>

            <button
              type="button"
              onClick={handleReset}
              style={styles.resetButton}
            >
              Reset Directory
            </button>
          </div>
        </section>

        <section aria-label="Directory results">
          <h2 style={styles.sectionTitle}>Scientists &amp; Pioneers</h2>

          {visiblePeople.length === 0 ? (
            <p style={styles.empty}>
              No matching people found. Try changing your search or IQ
              filter.
            </p>
          ) : (
            <ul style={styles.list}>
              {visiblePeople.map((person) => (
                <li key={person.id} style={styles.card}>
                  <h3 style={styles.personName}>{person.name}</h3>

                  <div style={styles.details}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Age</span>
                      <span style={styles.detailValue}>
                        {person.age}
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>IQ</span>
                      <span style={styles.detailValue}>
                        {person.iq}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Delete ${person.name}`}
                    onClick={() => handleDelete(person.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}