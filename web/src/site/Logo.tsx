import { useSection } from '../content/ContentContext';
import { Img } from '../content/Img';

/** Shows the light-background logo in light mode and the dark-background logo in dark mode, or forces one. */
export function Logo({ className = '', force }: { className?: string; force?: 'onDark' | 'onLight' }) {
  const site = useSection('site');
  if (force) return <Img id={force === 'onDark' ? site.logoOnDarkId : site.logoOnLightId} alt={site.name} className={className} sizes="200px" priority />;
  return (
    <>
      <Img id={site.logoOnLightId} alt={site.name} className={`${className} dark:hidden`} sizes="200px" priority />
      <Img id={site.logoOnDarkId} alt={site.name} className={`${className} hidden dark:block`} sizes="200px" priority />
    </>
  );
}
