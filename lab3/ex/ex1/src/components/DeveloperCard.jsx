import { Fragment, useState } from 'react';
import SkillBadge from './SkillBadge';
import styles from './DeveloperCard.module.css';

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function DeveloperCard({
  fullName = 'Dang Hoang Nguyen',
  role = 'Senior Systems Architect • UIT S3T',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240',
  metrics = {
    commits: 512,
    vmNodes: 0,
    allyScore: 100,
  },
  skills = [
    {
      id: 'sk-1',
      name: 'React 19 Fiber',
      tier: 'Core',
    },
  ],
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initials = getInitials(fullName) || 'NA';

  return (
    <article
      className={styles.card}
      aria-labelledby="dev-heading"
    >
      <header className={styles.header}>
        {avatarFailed ? (
          <span
            className={styles.avatarFallback}
            role="img"
            aria-label={`${fullName} initials`}
          >
            {initials}
          </span>
        ) : (
          <img
            className={styles.avatar}
            src={avatarUrl}
            alt={fullName}
            width={64}
            height={64}
            onError={() => setAvatarFailed(true)}
          />
        )}

        <hgroup className={styles.identity}>
          <h2 id="dev-heading" className={styles.name}>
            {fullName}
          </h2>
          <p className={styles.role}>{role}</p>
        </hgroup>
      </header>

      <dl className={styles.metrics}>
        {Object.entries(metrics).map(([key, value]) => (
          <Fragment key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>

      <ul
        className={styles.skills}
        aria-label="Engineered Skills"
      >
        {skills.map((skill) => (
          <li key={skill.id}>
            <SkillBadge className={styles.skillBadge}>
              {skill.name} ({skill.tier})
            </SkillBadge>
          </li>
        ))}
      </ul>
    </article>
  );
}