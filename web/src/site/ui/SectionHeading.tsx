import type { ReactNode } from 'react';
import { DisplayText } from '../../content/DisplayText';
import { Reveal } from '../Reveal';
import { Eyebrow } from './Eyebrow';

/** Eyebrow + big display title (+ optional intro and right-hand action). */
export function SectionHeading({ eyebrow, title, intro, action, as: H = 'h2', size = 'xl', accent }: {
  eyebrow?: string; title: string; intro?: string; action?: ReactNode; as?: 'h1' | 'h2'; size?: 'xl' | 'md'; accent?: 'text' | 'mark';
}) {
  return (
    <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6 sm:mb-16">
      <div className="flex max-w-4xl flex-col gap-5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <H className={size === 'xl' ? 'h2-xl' : 'h2'}><DisplayText text={title} accent={accent} /></H>
        {intro && <p className="lead max-w-2xl">{intro}</p>}
      </div>
      {action}
    </Reveal>
  );
}
