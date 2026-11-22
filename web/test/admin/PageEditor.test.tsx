import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { PageEditor } from '../../src/admin/pages/PageEditor';
import { ToastProvider } from '../../src/admin/Toast';
import { fixture } from '../fixture';

afterEach(() => vi.restoreAllMocks());

function mockApi(put: { status: number; body: unknown }) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    const m = url.match(/^\/api\/admin\/sections\/(.+)$/);
    if (m && method === 'GET') {
      const key = decodeURIComponent(m[1]!) as keyof typeof fixture.sections;
      return json(200, { key, data: fixture.sections[key], version: 3 });
    }
    if (m && method === 'PUT') return json(put.status, put.body);
    if (url === '/api/content') return json(200, fixture);
    if (url === '/api/admin/media') return json(200, []);
    return json(404, { error: 'Not found.' });
  });
  return calls;
}

function renderPage() {
  const router = createMemoryRouter([{ path: '/admin/:page/:tab?', element: <PageEditor pageId="homepage" /> }], { initialEntries: ['/admin/homepage/visit'] });
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider><RouterProvider router={router} /></ToastProvider>
    </QueryClientProvider>,
  );
}

describe('PageEditor', () => {
  it('saves only the section that changed, with the version it loaded', async () => {
    const calls = mockApi({ status: 200, body: { version: 4 } });
    renderPage();
    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Riders love *Faction*');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Changes saved')).toBeInTheDocument();
    const puts = calls.filter((c) => c.method === 'PUT');
    expect(puts).toHaveLength(1);
    expect(puts[0]!.url).toBe('/api/admin/sections/home.map');
    expect(puts[0]!.body).toEqual({ data: { ...fixture.sections['home.map'], title: 'Riders love *Faction*' }, version: 3 });
  });

  it('keeps my edits and explains a conflict', async () => {
    mockApi({ status: 409, body: { error: 'Someone else changed this, reload to see their version.' } });
    renderPage();
    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Mine');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Someone else changed this, reload to see their version\./)).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Mine');
    expect(screen.getByRole('button', { name: 'Reload their version' })).toBeInTheDocument();
  });

  it('validates before sending and marks the tab that needs attention', async () => {
    const calls = mockApi({ status: 200, body: { version: 4 } });
    renderPage();
    await userEvent.clear(await screen.findByLabelText('Title'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
    const tabs = screen.getByRole('tablist');
    expect(within(tabs).getByRole('tab', { name: /Visit us/ })).toHaveAttribute('data-invalid', 'true');
  });

  it('shows unsaved changes and can discard them', async () => {
    mockApi({ status: 200, body: { version: 4 } });
    renderPage();
    const title = await screen.findByLabelText('Title');
    await userEvent.type(title, '!');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByLabelText('Title')).toHaveValue(fixture.sections['home.map'].title);
  });
});
