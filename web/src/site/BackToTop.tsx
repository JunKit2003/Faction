import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const { scrollYProgress } = useScroll();
  const [show, setShow] = useState(false);
  useEffect(() => scrollYProgress.on('change', () => setShow(window.scrollY > 400)), [scrollYProgress]);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button" aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-fg text-bg shadow-xl transition-transform hover:-translate-y-1"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
            <motion.circle cx="24" cy="24" r="22" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ pathLength: scrollYProgress }} />
          </svg>
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
