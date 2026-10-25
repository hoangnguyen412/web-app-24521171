export const SMART_PEOPLE = [
  { id: 'sp-1', name: 'Johann Goethe', age: 82, iq: 210 },
  { id: 'sp-2', name: 'Albert Einstein', age: 76, iq: 205 },
  { id: 'sp-3', name: 'Leonardo da Vinci', age: 67, iq: 180 },
  { id: 'sp-4', name: 'Isaac Newton', age: 84, iq: 190 },
  { id: 'sp-5', name: 'James Maxwell', age: 48, iq: 190 },
  { id: 'sp-6', name: 'William Sidis', age: 46, iq: 200 },
  { id: 'sp-7', name: 'Dang Hoang Nguyen', age: 20, iq: 115 },
];

export default function ScientistDirectory() {
  return (
    <section aria-label="Scientist and Pioneer Directory">
      <h1>Scientist &amp; Pioneer Directory</h1>

      <ul>
        {SMART_PEOPLE.map((person) => (
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