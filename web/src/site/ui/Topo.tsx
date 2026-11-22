import { useMemo } from 'react';

/** Faint topographic contour lines (deterministic, no image request). */
export function Topo({ className = '', seed = 1, rings = 14 }: { className?: string; seed?: number; rings?: number }) {
  const paths = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const centres = [[0.22 + rnd() * 0.1, 0.35 + rnd() * 0.2], [0.78 - rnd() * 0.1, 0.7 - rnd() * 0.2]] as const;
    const out: string[] = [];
    for (const [cx, cy] of centres) {
      const phase = rnd() * Math.PI * 2;
      for (let r = 1; r <= rings; r++) {
        const pts: string[] = [];
        const R = r * 34;
        for (let a = 0; a <= 64; a++) {
          const t = (a / 64) * Math.PI * 2;
          const wobble = 1 + 0.16 * Math.sin(3 * t + phase + r * 0.35) + 0.08 * Math.sin(5 * t - phase * 1.7 + r * 0.2);
          pts.push(`${(cx * 1200 + Math.cos(t) * R * wobble * 1.35).toFixed(1)},${(cy * 800 + Math.sin(t) * R * wobble).toFixed(1)}`);
        }
        out.push(`M${pts.join('L')}Z`);
      }
    }
    return out;
  }, [seed, rings]);
  return (
    <svg aria-hidden viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {paths.map((d, i) => <path key={i} d={d} vectorEffect="non-scaling-stroke" />)}
      </g>
    </svg>
  );
}
