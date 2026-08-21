import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNotificationPermission } from './useNotificationPermission';

describe('useNotificationPermission', () => {
  it('starts at the given initial status without requesting permission', () => {
    const requestPermission = vi.fn();
    const { result } = renderHook(() =>
      useNotificationPermission({ requestPermission, initialStatus: 'default' }),
    );
    expect(result.current.status).toBe('default');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('requestAccess grants status on acceptance', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    const { result } = renderHook(() =>
      useNotificationPermission({ requestPermission, initialStatus: 'default' }),
    );

    act(() => {
      result.current.requestAccess();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });
  });

  it('requestAccess sets denied when the browser rejects the request', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied');
    const { result } = renderHook(() =>
      useNotificationPermission({ requestPermission, initialStatus: 'default' }),
    );

    act(() => {
      result.current.requestAccess();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('denied');
    });
  });

  it('is unsupported when no requestPermission is available at all', () => {
    const { result } = renderHook(() => useNotificationPermission({}));
    expect(result.current.status).toBe('unsupported');
  });
});
