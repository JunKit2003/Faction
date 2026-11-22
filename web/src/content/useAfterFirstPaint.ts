import { useEffect, useState } from 'react';

/** False on the first render, true right after the browser has painted it. Used to keep below-the-fold work (and its image requests) off the critical path. */
export function useAfterFirstPaint(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const raf = requestAnimationFrame(() => { t = setTimeout(() => setReady(true), 0); });
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);
  return ready;
}
