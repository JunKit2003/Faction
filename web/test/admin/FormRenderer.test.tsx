import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormRenderer } from '../../src/admin/form/FormRenderer';
import type { Field } from '../../src/admin/form/fields';

afterEach(() => vi.restoreAllMocks());

const fields: Field[] = [
  { name: 'title', label: 'Title', kind: 'text' },
  {
    name: 'items', label: 'Questions', kind: 'list', itemLabel: 'Question', newItem: { q: '', a: '' },
    fields: [{ name: 'q', label: 'Question', kind: 'text' }, { name: 'a', label: 'Answer', kind: 'rich' }],
  },
];

type V = { title: string; items: { q: string; a: string }[] };
function Harness({ issues = {}, onValue }: { issues?: Record<string, string>; onValue?: (v: V) => void }) {
  const [v, setV] = useState<V>({ title: 'FAQ', items: [{ q: 'Q1', a: 'A1' }, { q: 'Q2', a: 'A2' }] });
  return <FormRenderer fields={fields} value={v} issues={issues} onChange={(n) => { setV(n as V); onValue?.(n as V); }} />;
}

describe('FormRenderer lists (rows + edit dialog)', () => {
  it('shows each item as a row and edits it in a dialog', async () => {
    let last: V | undefined;
    render(<Harness onValue={(v) => (last = v)} />);
    const row = screen.getByRole('listitem', { name: 'Question 2' });
    expect(row).toHaveTextContent('Q2');
    expect(row).toHaveTextContent('A2');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Question 2' });
    const q = within(dialog).getByLabelText('Question');
    await userEvent.clear(q);
    await userEvent.type(q, 'Do you service e-MTBs?');
    expect(last!.items[1]!.q).toBe('Do you service e-MTBs?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('listitem', { name: 'Question 2' })).toHaveTextContent('Do you service e-MTBs?');
  });

  it('reorders, adds (opening the new item) and removes after confirming', async () => {
    let last: V | undefined;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Harness onValue={(v) => (last = v)} />);
    await userEvent.click(within(screen.getByRole('listitem', { name: 'Question 2' })).getByRole('button', { name: 'Move up' }));
    expect(last!.items.map((i) => i.q)).toEqual(['Q2', 'Q1']);
    await userEvent.click(screen.getByRole('button', { name: 'Add question' }));
    expect(last!.items).toHaveLength(3);
    expect(screen.getByRole('dialog', { name: 'Question 3' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(within(screen.getByRole('listitem', { name: 'Question 1' })).getByRole('button', { name: 'Remove' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(last!.items.map((i) => i.q)).toEqual(['Q1', '']);
  });

  it('keeps the item when removal is cancelled', async () => {
    let last: V | undefined;
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Harness onValue={(v) => (last = v)} />);
    await userEvent.click(within(screen.getByRole('listitem', { name: 'Question 1' })).getByRole('button', { name: 'Remove' }));
    expect(last).toBeUndefined();
  });

  it('flags the row that has a problem and shows it in the dialog', async () => {
    render(<Harness issues={{ 'items.1.q': 'Question is required', title: 'Title is required' }} />);
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    const row = screen.getByRole('listitem', { name: 'Question 2' });
    expect(row).toHaveTextContent('Needs attention');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    const q = within(screen.getByRole('dialog')).getByLabelText('Question');
    expect(q).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Question is required')).toBeInTheDocument();
  });
});
