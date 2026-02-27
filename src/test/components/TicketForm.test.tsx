import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TicketForm from '../../components/tickets/TicketForm';

describe('TicketForm', () => {
  it('renders title and description inputs', () => {
    render(<TicketForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear Ticket' })).toBeInTheDocument();
  });

  it('calls onSubmit with form data and clears fields', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<TicketForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Título'), 'Bug report');
    await user.type(screen.getByLabelText('Descripción'), 'App crashes on login');
    await user.click(screen.getByRole('button', { name: 'Crear Ticket' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Bug report',
      description: 'App crashes on login',
    });

    // Fields should be cleared after submit
    expect(screen.getByLabelText('Título')).toHaveValue('');
    expect(screen.getByLabelText('Descripción')).toHaveValue('');
  });

  it('updates input values when user types', async () => {
    const user = userEvent.setup();
    render(<TicketForm onSubmit={vi.fn()} />);

    const titleInput = screen.getByLabelText('Título');
    await user.type(titleInput, 'Test');

    expect(titleInput).toHaveValue('Test');
  });
});
