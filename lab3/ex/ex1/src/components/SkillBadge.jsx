function SkillBadge({ children, className = '' }) {
  return (
    <span className={className}>
      {children}
    </span>
  );
}

export default SkillBadge;