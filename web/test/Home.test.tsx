import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import Home from '../src/site/pages/Home';
import { renderWithContent } from './render';

describe('Home', () => {
  it('renders the hero first and the rest of the page right after first paint', async () => {
    const { container } = renderWithContent(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.querySelector('[data-section="home.services"]')).toBeNull();
    await waitFor(() => expect(container.querySelector('[data-section="home.services"]')).not.toBeNull());
    expect(container.querySelector('[data-section="home.stats"]')).not.toBeNull();
    expect(container.querySelector('[data-section="home.process"]')).not.toBeNull();
    expect(container.querySelector('[data-section="home.map"]')).not.toBeNull();
  });
});
