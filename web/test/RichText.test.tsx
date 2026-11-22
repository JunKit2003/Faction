import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RichText } from '../src/content/RichText';
import { renderWithContent } from './render';

describe('RichText', () => {
  it('renders bold and internal links', () => {
    const { container } = renderWithContent(<RichText text="Beside **Bukit Kiara**. See [Contact](/contact)." />);
    expect(container.querySelector('strong')).toHaveTextContent('Bukit Kiara');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });

  it('opens external links in a new tab safely', () => {
    renderWithContent(<RichText text="[IG](https://instagram.com/x)" />);
    const a = screen.getByRole('link', { name: 'IG' });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders HTML and javascript: links as plain text', () => {
    const { container } = renderWithContent(<RichText text={'<script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container).toHaveTextContent('<script>alert(1)</script> [x](javascript:alert(1))');
  });
});
