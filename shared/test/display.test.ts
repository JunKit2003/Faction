import { describe, expect, it } from 'vitest';
import { parseDisplay, plainDisplay } from '../src/index.js';

describe('parseDisplay (headline accents)', () => {
  it('splits _outlined_ and *lime* words from plain text', () => {
    expect(parseDisplay('Ride _hard._ We’ll keep you *rolling.*')).toEqual([
      { type: 'plain', text: 'Ride ' }, { type: 'outline', text: 'hard.' }, { type: 'plain', text: ' We’ll keep you ' }, { type: 'accent', text: 'rolling.' },
    ]);
  });
  it('leaves unmatched markers as text', () => {
    expect(parseDisplay('5 * 3 = _fifteen')).toEqual([{ type: 'plain', text: '5 * 3 = _fifteen' }]);
  });
  it('plainDisplay strips the markers for titles and screen readers', () => {
    expect(plainDisplay('Get *dialled.*')).toBe('Get dialled.');
    expect(plainDisplay('Ride _hard._')).toBe('Ride hard.');
  });
});
