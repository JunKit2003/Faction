import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Stats } from '../src/site/home/Stats';
import { yearsSince } from '../src/site/home/count';
import { renderWithContent } from './render';

const realMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = realMatchMedia; vi.useRealTimers(); });

describe('Stats', () => {
  it('shows final values immediately with reduced motion', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;
    const { container } = renderWithContent(<Stats />);
    const visible = [...container.querySelectorAll('span[aria-hidden="true"]')].map((e) => e.textContent);
    const spoken = [...container.querySelectorAll('.sr-only')].map((e) => e.textContent);
    const expected = ['1,800+', '500+', '5.0★', `${yearsSince(2022)}+`];
    expect(visible).toEqual(expected);
    expect(spoken).toEqual(expected);
    expect(screen.getByText('21 Google Reviews')).toBeInTheDocument();
  });
});

describe('yearsSince', () => {
  it('is whole years since the opening year, at least 1', () => {
    expect(yearsSince(2022, new Date('2026-11-22'))).toBe(4);
    expect(yearsSince(2026, new Date('2026-11-22'))).toBe(1);
  });
});

import { splitNumber } from '../src/site/home/count';
describe('splitNumber', () => {
  it('splits a stat into prefix, number, decimals and suffix', () => {
    expect(splitNumber('1,800+')).toEqual({ prefix: '', value: 1800, decimals: 0, grouped: true, suffix: '+' });
    expect(splitNumber('5.0★')).toEqual({ prefix: '', value: 5, decimals: 1, grouped: false, suffix: '★' });
    expect(splitNumber('RM 50')).toEqual({ prefix: 'RM ', value: 50, decimals: 0, grouped: false, suffix: '' });
    expect(splitNumber('Lots')).toBeNull();
  });
});
