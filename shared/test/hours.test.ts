import { describe, expect, it } from 'vitest';
import { formatHours, isOpenAt, fillHours, type Hours } from '../src/index.js';

const seed: Hours = {
  mon: { closed: false, open: '11:00', close: '19:30' },
  tue: { closed: false, open: '11:00', close: '19:30' },
  wed: { closed: false, open: '11:00', close: '19:30' },
  thu: { closed: false, open: '11:00', close: '19:30' },
  fri: { closed: false, open: '11:00', close: '19:30' },
  sat: { closed: false, open: '11:00', close: '16:00' },
  sun: { closed: true, open: '', close: '' },
};

// Kuala Lumpur is UTC+8 with no DST.
const kl = (iso: string) => new Date(iso + '+08:00');

describe('formatHours', () => {
  it('groups consecutive equal days', () => {
    expect(formatHours(seed)).toEqual(['Mon–Fri · 11:00–19:30', 'Sat · 11:00–16:00', 'Sun · Closed']);
  });
  it('does not group non-consecutive equal days', () => {
    const h = { ...seed, wed: { closed: true, open: '', close: '' } };
    expect(formatHours(h)).toEqual(['Mon–Tue · 11:00–19:30', 'Wed · Closed', 'Thu–Fri · 11:00–19:30', 'Sat · 11:00–16:00', 'Sun · Closed']);
  });
});

describe('isOpenAt (Asia/Kuala_Lumpur)', () => {
  it.each([
    ['2026-11-23T12:00:00', true], // Monday
    ['2026-11-28T16:30:00', false], // Saturday after close
    ['2026-11-29T12:00:00', false], // Sunday
    ['2026-11-23T10:59:00', false],
    ['2026-11-23T19:29:00', true],
    ['2026-11-23T19:30:00', false],
  ])('%s → %s', (t, open) => {
    expect(isOpenAt(seed, kl(t))).toBe(open);
  });
  it('uses KL time, not the machine timezone', () => {
    expect(isOpenAt(seed, new Date('2026-11-23T04:00:00Z'))).toBe(true); // 12:00 KL Monday
    expect(isOpenAt(seed, new Date('2026-11-22T20:00:00Z'))).toBe(false); // 04:00 KL Monday
  });
});

describe('fillHours', () => {
  it('replaces {hours} with the standard wording', () => {
    expect(fillHours('We’re open {hours}.', seed)).toBe('We’re open Mon–Fri · 11:00–19:30, Sat · 11:00–16:00, Sun · Closed.');
  });
  it('leaves text without the placeholder alone', () => {
    expect(fillHours('No hours here', seed)).toBe('No hours here');
  });
});
