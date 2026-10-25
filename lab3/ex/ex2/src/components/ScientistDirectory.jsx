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

export default function ScientistDirectory({
  initialData = SMART_PEOPLE,
}) {
  const nameId = useId();
  const iqId = useId();
  const sortId = useId();

  const [people] = useState(initialData);
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

  return (
    <section aria-label="Scientist and Pioneer Directory">
      <h1>Scientist &amp; Pioneer Directory</h1>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <p>
          <label htmlFor={nameId}>Search by name</label>
          <input
            id={nameId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter a name..."
          />
        </p>

        <p>
          <label htmlFor={iqId}>Minimum IQ</label>
          <input
            id={iqId}
            type="number"
            min={0}
            step={1}
            value={minIq}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              setMinIq(Number.isNaN(value) ? 0 : Math.max(0, value));
            }}
          />
        </p>

        <p>
          <label htmlFor={sortId}>Sort by</label>
          <select
            id={sortId}
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="iq-desc">IQ: High to Low</option>
            <option value="age-asc">Age: Youngest to Oldest</option>
          </select>
        </p>
      </form>

      <ul>
        {visiblePeople.map((person) => (
          <li key={person.id}>
            <h2>{person.name}</h2>
            <p>Age: {person.age}</p>
            <p>IQ: {person.iq}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}