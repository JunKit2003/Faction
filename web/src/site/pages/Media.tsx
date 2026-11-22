import { useState } from 'react';
import { motion } from 'motion/react';
import { Expand } from 'lucide-react';
import { useContent, useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { PageHero } from '../PageHero';
import { Lightbox } from '../media/Lightbox';

export default function Media() {
  const m = useSection('media');
  const { media } = useContent();
  const ids = m.imageIds.filter((id) => media[id]);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <PageHero title={m.title} />
      <section className="container-x pb-24">
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
          {ids.map((id, i) => (
            <motion.li key={id + i} className="break-inside-avoid"
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}>
              <button type="button" onClick={() => setOpen(i)} aria-label={media[id]?.alt ? `Open: ${media[id]!.alt}` : `Open image ${i + 1}`}
                className="group relative block w-full overflow-hidden rounded-3xl border border-line bg-surface">
                <Img id={id} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="w-full transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105" />
                <span className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/30" />
                <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-white text-black opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <Expand className="h-5 w-5" />
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </section>
      <Lightbox ids={ids} index={open} onChange={setOpen} />
    </>
  );
}
