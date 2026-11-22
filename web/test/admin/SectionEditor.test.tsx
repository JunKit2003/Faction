import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SectionEditor } from '../../src/admin/pages/SectionEditor';
import { fixture } from '../fixture';

afterEach(() => vi.restoreAllMocks());

function mockApi(putResponse: { status: number; body: unknown }) {
  const calls: { method: string; url: string; body?: unknown }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url === '/api/admin/sections/home.map' && method === 'GET') return json(200, { key: 'home.map', data: { title: 'Riders trust Faction', subtitle: 'See real reviews' }, version: 3 });
    if (url === '/api/admin/sections/home.map' && method === 'PUT') return json(putResponse.status, putResponse.body);
    if (url === '/api/content') return json(200, fixture);
    if (url === '/api/admin/media') return json(200, []);
    return json(404, { error: 'Not found.' });
  });
  return calls;
}

function renderEditor() {
  const router = createMemoryRouter([{ path: '/admin/sections/:key', element: <SectionEditor sectionKey="home.map" /> }], { initialEntries: ['/admin/sections/home.map'] });
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RouterProvider router={router} /></QueryClientProvider>);
}

describe('SectionEditor', () => {
  it('saves with the loaded version', async () => {
    const calls = mockApi({ status: 200, body: { version: 4 } });
    renderEditor();
    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Riders love Faction');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    const put = calls.find((c) => c.method === 'PUT')!;
    expect(put.body).toEqual({ data: { title: 'Riders love Faction', subtitle: 'See real reviews' }, version: 3 });
  });

  it('keeps my edits and explains a conflict', async () => {
    mockApi({ status: 409, body: { error: 'Someone else changed this, reload to see their version.' } });
    renderEditor();
    const title = await screen.findByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Mine');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Someone else changed this, reload to see their version.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Mine');
    expect(screen.getByRole('button', { name: 'Reload their version' })).toBeInTheDocument();
  });

  it('validates before sending', async () => {
    const calls = mockApi({ status: 200, body: { version: 4 } });
    renderEditor();
    await userEvent.clear(await screen.findByLabelText('Title'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
  });
});
