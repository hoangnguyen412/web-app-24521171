function SkillBadge({ skill, className = '' }) {
  return (
    <span className={className}>
      {skill}
    </span>
  );
}

export default SkillBadge;