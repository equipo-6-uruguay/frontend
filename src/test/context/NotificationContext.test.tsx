import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';

const Consumer = () => {
  const { trigger, refreshUnread } = useNotifications();
  return (
    <div>
      <span data-testid="trigger">{trigger}</span>
      <button onClick={refreshUnread}>Refresh</button>
    </div>
  );
};

describe('NotificationContext', () => {
  it('provides initial trigger value of 0', () => {
    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>
    );

    expect(screen.getByTestId('trigger').textContent).toBe('0');
  });

  it('increments trigger when refreshUnread is called', async () => {
    const { getByTestId, getByText } = render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>
    );

    expect(getByTestId('trigger').textContent).toBe('0');

    await act(async () => {
      getByText('Refresh').click();
    });

    expect(getByTestId('trigger').textContent).toBe('1');
  });

  it('throws when used outside NotificationProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      'useNotifications must be used within NotificationProvider'
    );
    consoleError.mockRestore();
  });
});
