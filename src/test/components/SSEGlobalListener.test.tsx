import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SSEGlobalListener from '../../components/layout/SSEGlobalListener';

vi.mock('../../hooks/useSSE', () => ({
  useSSE: vi.fn(),
}));

import { useSSE } from '../../hooks/useSSE';

describe('SSEGlobalListener', () => {
  it('calls useSSE hook and renders nothing', () => {
    const { container } = render(<SSEGlobalListener />);

    expect(useSSE).toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });
});
