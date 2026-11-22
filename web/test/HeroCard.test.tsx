import { afterEach, describe, expect, it } from 'vitest';
import { Hero } from '../src/site/home/Hero';
import { renderWithContent } from './render';
import { fixture } from './fixture';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; });
const wideScreen = () => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;
};

describe('hero floating card', () => {
  it('shows its own photos, not the banner photos', () => {
    wideScreen();
    const { container } = renderWithContent(<Hero />);
    const card = container.querySelector('[data-hero-card]')!;
    expect(card).toBeTruthy();
    const srcs = [...card.querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(srcs).toContain(fixture.media[fixture.sections['home.hero'].badgeImageIds[0]!]!.url);
    for (const id of fixture.sections['home.hero'].slideIds) expect(srcs).not.toContain(fixture.media[id]!.url);
  });

  it('keeps the text but drops the photo when no card photos are chosen', () => {
    wideScreen();
    const content = structuredClone(fixture);
    content.sections['home.hero'].badgeImageIds = [];
    const { container } = renderWithContent(<Hero />, { content });
    const card = container.querySelector('[data-hero-card]')!;
    expect(card.querySelector('img')).toBeNull();
    expect(card).toHaveTextContent('Same-day fixes');
  });
});
