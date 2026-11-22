import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditDiff, flatten } from '../../src/admin/pages/AuditDiff';

const before = { items: [{ value: '1,800+', label: 'Bikes Serviced' }, { value: '500+', label: 'Suspension Overhauls' }] };
const after = { items: [{ value: '2,000+', label: 'Bikes Serviced' }, { value: '500+', label: 'Suspension Overhauls' }] };

describe('AuditDiff', () => {
  it('shows changed fields side by side, highlighted', () => {
    render(<AuditDiff before={before} after={after} />);
    const row = screen.getByText('1,800+').closest('tr')!;
    expect(row).toHaveAttribute('data-changed', 'true');
    expect(row).toHaveTextContent('2,000+');
    expect(row).toHaveTextContent('Items 1 › Value');
    expect(screen.queryByText('Suspension Overhauls')).toBeNull();
  });

  it('can show unchanged fields too', async () => {
    render(<AuditDiff before={before} after={after} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show unchanged fields' }));
    const row = screen.getAllByText('Suspension Overhauls')[0]!.closest('tr')!;
    expect(row).toHaveAttribute('data-changed', 'false');
  });

  it('handles creations and deletions', () => {
    render(<AuditDiff before={null} after={{ email: 'staff@faction.my' }} />);
    expect(screen.getByText('staff@faction.my').closest('tr')).toHaveAttribute('data-changed', 'true');
  });

  it('flattens nested data into readable paths', () => {
    expect(flatten({ a: { b: [1, 'x'] }, c: true })).toEqual([['A › B 1', '1'], ['A › B 2', 'x'], ['C', 'Yes']]);
  });
});
