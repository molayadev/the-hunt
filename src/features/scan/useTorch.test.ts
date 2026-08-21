import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTorch } from './useTorch';
import type { TorchTrack } from './useTorch';

describe('useTorch', () => {
  it('is unsupported when the track has no torch capability', () => {
    const track: TorchTrack = {
      getCapabilities: () => ({ torch: false }),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() => useTorch(track));
    expect(result.current.isSupported).toBe(false);
  });

  it('is unsupported when there is no track at all', () => {
    const { result } = renderHook(() => useTorch(null));
    expect(result.current.isSupported).toBe(false);
    expect(result.current.isOn).toBe(false);
  });

  it('is supported when the track reports torch capability', () => {
    const track: TorchTrack = {
      getCapabilities: () => ({ torch: true }),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() => useTorch(track));
    expect(result.current.isSupported).toBe(true);
  });

  it('toggle turns the torch on by applying the torch constraint', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    const track: TorchTrack = { getCapabilities: () => ({ torch: true }), applyConstraints };
    const { result } = renderHook(() => useTorch(track));

    act(() => {
      result.current.toggle();
    });

    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });
    await waitFor(() => {
      expect(result.current.isOn).toBe(true);
    });
  });

  it('toggling an unsupported track does nothing', () => {
    const applyConstraints = vi.fn();
    const track: TorchTrack = { getCapabilities: () => ({ torch: false }), applyConstraints };
    const { result } = renderHook(() => useTorch(track));

    act(() => {
      result.current.toggle();
    });

    expect(applyConstraints).not.toHaveBeenCalled();
    expect(result.current.isOn).toBe(false);
  });
});
