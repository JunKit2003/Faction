import { describe, expect, it } from 'vitest';
import About from '../src/site/pages/About';
import { renderWithContent } from './render';
import { fixture } from './fixture';

describe('About story image', () => {
  it('shows the whole photo at its own shape: not cropped, not zoomed', () => {
    const { container } = renderWithContent(<About />);
    const id = fixture.sections.about.imageId;
    const img = container.querySelector(`img[src="${fixture.media[id]!.url}"]`) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.className).not.toMatch(/object-cover/);
    expect(img.className).toMatch(/h-auto/);
    expect(img.className).toMatch(/w-auto/);
    expect(img.className).toMatch(/max-w-full/);
    for (let el: HTMLElement | null = img; el && el !== container; el = el.parentElement) {
      expect(el.style.transform, 'no zoom/parallax wrapper').not.toMatch(/scale/);
      expect(el.className, 'no fixed-ratio crop frame').not.toMatch(/aspect-\[/);
    }
  });
});
