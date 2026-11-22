import { useSection } from '../content/ContentContext';
import { SOCIAL_ICONS, SOCIAL_NAMES } from './icons';

export function SocialLinks({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { socials } = useSection('site');
  const box = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const icon = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <ul className="flex flex-wrap gap-3">
      {socials.map((s, i) => {
        const Icon = SOCIAL_ICONS[s.platform];
        return (
          <li key={i}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_NAMES[s.platform]}
              className={`${box} grid place-items-center rounded-full border border-line text-fg transition duration-300 hover:-translate-y-1 hover:border-accent hover:bg-accent hover:text-black focus-visible:-translate-y-1`}>
              <Icon className={icon} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
