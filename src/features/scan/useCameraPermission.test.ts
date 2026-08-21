import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCameraPermission } from './useCameraPermission';

describe('useCameraPermission', () => {
  it('starts idle, without requesting the camera', () => {
    const getUserMedia = vi.fn();
    const { result } = renderHook(() => useCameraPermission({ getUserMedia }));
    expect(result.current.status).toBe('idle');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('requestAccess grants status and exposes the stream on success', async () => {
    const stream = { id: 'fake-stream' } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const { result } = renderHook(() => useCameraPermission({ getUserMedia }));

    act(() => {
      result.current.requestAccess();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });
    expect(result.current.stream).toBe(stream);
  });

  it('requestAccess sets denied when the browser rejects the request', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const { result } = renderHook(() => useCameraPermission({ getUserMedia }));

    act(() => {
      result.current.requestAccess();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('denied');
    });
    expect(result.current.stream).toBeNull();
  });

  it('is unsupported when no getUserMedia is available at all', () => {
    const { result } = renderHook(() => useCameraPermission({}));
    expect(result.current.status).toBe('unsupported');
  });
});
