import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../src/site/pages/Contact';
import { renderWithContent } from './render';

afterEach(() => vi.restoreAllMocks());

describe('ContactForm', () => {
  it('requires a name and does not open WhatsApp', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderWithContent(<ContactForm />);
    await userEvent.type(screen.getByLabelText('Message'), 'Fork service?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(open).not.toHaveBeenCalled();
  });

  it('requires a message', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    renderWithContent(<ContactForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Aiman');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText('Please include a message.')).toBeInTheDocument();
  });

  it('opens WhatsApp with the message pre-filled', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    renderWithContent(<ContactForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Aiman');
    await userEvent.type(screen.getByLabelText('Message'), 'Fork service?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    const url = open.mock.calls[0]![0] as string;
    expect(url.startsWith('https://wa.me/601133321767?text=')).toBe(true);
    const text = decodeURIComponent(url.split('?text=')[1]!);
    expect(text).toBe('New website enquiry\nName: Aiman\nMessage: Fork service?');
    expect(screen.getByText('Opening WhatsApp…')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });
});
