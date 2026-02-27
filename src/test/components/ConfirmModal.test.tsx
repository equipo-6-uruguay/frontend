import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../../components/ui/ConfirmModal';

describe('ConfirmModal', () => {
  it('renders message and action buttons', () => {
    render(
      <ConfirmModal
        message="¿Estás seguro?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('calls onConfirm when Eliminar is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        message="Confirm delete"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByText('Eliminar'));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancelar is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        message="Confirm delete"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText('Cancelar'));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when overlay is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        message="Confirm delete"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Click the overlay (outermost element)
    await user.click(document.querySelector('.confirm-overlay')!);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        message="Confirm delete"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when clicking inside modal', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        message="Confirm delete"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Click on the message text (inside the modal)
    await user.click(screen.getByText('Confirm delete'));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('renders custom confirmLabel when provided', () => {
    render(
      <ConfirmModal
        message="¿Limpiar todo?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Limpiar todo"
      />
    );

    expect(screen.getByText('Limpiar todo')).toBeInTheDocument();
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  it('defaults confirmLabel to Eliminar', () => {
    render(
      <ConfirmModal
        message="¿Está seguro?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });
});
