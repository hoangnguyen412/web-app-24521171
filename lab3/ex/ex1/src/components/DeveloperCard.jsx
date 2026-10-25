import { useState } from 'react';
import SkillBadge from './SkillBadge';

const DEFAULT_SKILLS = [
  'React',
  'JavaScript',
  'Node.js',
  'UI/UX',
];

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function DeveloperCard({
  name = 'Alex Nguyen',
  role = 'Frontend Developer',
  bio = 'Building useful products through clean code and thoughtful design.',
  avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&h=240&fit=crop&crop=faces',
  location = 'Ho Chi Minh City, Vietnam',
  gamingHandle = 'PRO-ACE',
  favoriteGame = 'Valorant',
  rank = 'Diamond',
  skills = DEFAULT_SKILLS,
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const initials = getInitials(name) || 'NA';

  return (
    <article className="developer-card">
      <header className="developer-card__header">
        {avatarFailed ? (
          <span
            className="developer-card__avatar-fallback"
            role="img"
            aria-label={`${name} initials`}
          >
            {initials}
          </span>
        ) : (
          <img
            className="developer-card__avatar"
            src={avatarUrl}
            alt={`Portrait of ${name}`}
            width={120}
            height={120}
            onError={() => setAvatarFailed(true)}
          />
        )}

        <hgroup>
          <h1>{name}</h1>
          <p>{role}</p>
        </hgroup>
      </header>

      <p className="developer-card__bio">{bio}</p>

      <dl className="developer-card__details">
        <dt>Location</dt>
        <dd>{location}</dd>

        <dt>Gaming Handle</dt>
        <dd>{gamingHandle}</dd>

        <dt>Favorite Game</dt>
        <dd>{favoriteGame}</dd>

        <dt>Rank</dt>
        <dd>{rank}</dd>
      </dl>

      <section
        className="developer-card__skills"
        aria-labelledby="developer-skills-heading"
      >
        <h2 id="developer-skills-heading">Technical Skills</h2>

        <ul>
          {skills.map((skill) => (
            <li key={skill}>
              <SkillBadge
                skill={skill}
                className="skill-badge"
              />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

export default DeveloperCard;