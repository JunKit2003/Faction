import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { PublicContent } from '@faction/shared';
import { ContentProvider } from '../src/content/ContentContext';
import { fixture } from './fixture';

export function renderWithContent(ui: ReactNode, { content = fixture, path = '/' }: { content?: PublicContent; path?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ContentProvider value={content}>{ui}</ContentProvider>
    </MemoryRouter>,
  );
}
