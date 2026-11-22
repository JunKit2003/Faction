import { motion } from 'motion/react';
import { SplitWords } from './Reveal';

export function PageHero({ title, intro }: { title: string; intro?: string }) {
  return (
    <section className="relative overflow-hidden pb-14 pt-36 sm:pb-20 sm:pt-44">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]" />
      <div className="container-x relative">
        <h1 className="h1 max-w-5xl"><SplitWords text={title} /></h1>
        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="lead mt-6 max-w-2xl"
          >
            {intro}
          </motion.p>
        )}
      </div>
    </section>
  );
}
