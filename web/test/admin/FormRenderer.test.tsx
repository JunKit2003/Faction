import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormRenderer } from '../../src/admin/form/FormRenderer';
import type { Field } from '../../src/admin/form/fields';

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

describe('FormRenderer', () => {
  it('edits a field inside a nested list item', async () => {
    let last: V | undefined;
    render(<Harness onValue={(v) => (last = v)} />);
    await userEvent.click(screen.getByRole('button', { name: /Q2/ }));
    const q = screen.getByLabelText('Question');
    await userEvent.clear(q);
    await userEvent.type(q, 'Do you service e-MTBs?');
    expect(last!.items[1]!.q).toBe('Do you service e-MTBs?');
    expect(last!.items[0]!.q).toBe('Q1');
  });

  it('reorders, adds and removes list items', async () => {
    let last: V | undefined;
    render(<Harness onValue={(v) => (last = v)} />);
    const second = screen.getByRole('listitem', { name: 'Question 2' });
    await userEvent.click(within(second).getByRole('button', { name: 'Move up' }));
    expect(last!.items.map((i) => i.q)).toEqual(['Q2', 'Q1']);
    await userEvent.click(screen.getByRole('button', { name: 'Add question' }));
    expect(last!.items).toHaveLength(3);
    expect(last!.items[2]).toEqual({ q: '', a: '' });
    await userEvent.click(within(screen.getByRole('listitem', { name: 'Question 1' })).getByRole('button', { name: 'Remove' }));
    expect(last!.items.map((i) => i.q)).toEqual(['Q1', '']);
  });

  it('shows an issue on the right field and opens its item', () => {
    render(<Harness issues={{ 'items.1.q': 'Question is required', title: 'Title is required' }} />);
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    const q = screen.getByLabelText('Question');
    expect(q).toHaveValue('Q2');
    expect(q).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Question is required')).toBeInTheDocument();
  });
});
