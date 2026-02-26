import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../../context/ToastContext';

const Consumer = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>Success</button>
      <button onClick={() => showToast('Error message', 'error')}>Error</button>
      <button onClick={() => showToast('Info message', 'info')}>Info</button>
    </div>
  );
};

describe('ToastContext', () => {
  it('renders toast when showToast is called', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
  });

  it('renders error toast with correct class', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Error'));

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-error');
  });

  it('auto-removes toast after 4 seconds', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Info'));
    expect(screen.getByText('Info message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByText('Info message')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('removes toast on close button click', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Success'));
    expect(screen.getByText('Success message')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Cerrar'));

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('throws when used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      'useToast debe ser usado dentro de un ToastProvider'
    );
    consoleError.mockRestore();
  });
});
