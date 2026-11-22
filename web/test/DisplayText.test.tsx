import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DisplayText } from '../src/content/DisplayText';

describe('DisplayText', () => {
  it('styles _outlined_ and *lime* words and reads as plain text', () => {
    const { container } = render(<h1><DisplayText text="Ride _hard._ We’ll keep you *rolling.*" /></h1>);
    expect(container.querySelector('.text-outline')).toHaveTextContent('hard.');
    expect(container.querySelector('[data-accent]')).toHaveTextContent('rolling.');
    expect(container.querySelector('h1')).toHaveTextContent('Ride hard. We’ll keep you rolling.');
    expect(container.textContent).not.toMatch(/[_*]/);
  });
  it('renders lime words outlined on lime backgrounds', () => {
    const { container } = render(<DisplayText text="Still *stuck?*" accent="outline" />);
    expect(container.querySelector('[data-accent]')).toHaveClass('text-outline');
  });
  it('can render lime words as a highlighter mark', () => {
    const { container } = render(<DisplayText text="Foot of *Bukit Kiara*" accent="mark" />);
    expect(container.querySelector('mark')).toHaveTextContent('Bukit Kiara');
  });
});
