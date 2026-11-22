export function Eyebrow({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return <p className={`eyebrow ${className}`}>{children}</p>;
}
