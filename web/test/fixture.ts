import type { PublicContent } from '@faction/shared';
// Built from the server seed so tests use the real content shape.
import { seedSections } from '../../server/src/seed/content';

const ids = new Proxy({}, { get: (_t, k) => String(k) }) as Record<string, string>;
const sections = seedSections((k) => ids[k]!);
const media = Object.fromEntries(
  ['hero1', 'hero3', 'hero4', 'image1', 'image2', 'image3', 'image4', 'image5', 'image6', 'logoOnLight', 'logoOnDark', 'favicon'].map((id) => [
    id, { id, url: `/uploads/${id}-960.webp`, srcset: `/uploads/${id}-480.webp 480w, /uploads/${id}-960.webp 960w`, width: 960, height: 640, alt: `${id} alt`, mime: 'image/webp' },
  ]),
);
export const fixture: PublicContent = { sections, media, version: 'test' };
