import { describe, expect, it, vi } from 'vitest';
import { vibrateOnDecode } from './hapticFeedback';

describe('vibrateOnDecode', () => {
  it('vibrates for 40ms when motion is not reduced', () => {
    const vibrate = vi.fn();
    vibrateOnDecode({ prefersReducedMotion: false, vibrate });
    expect(vibrate).toHaveBeenCalledWith(40);
  });

  it('does not vibrate when the user prefers reduced motion', () => {
    const vibrate = vi.fn();
    vibrateOnDecode({ prefersReducedMotion: true, vibrate });
    expect(vibrate).not.toHaveBeenCalled();
  });
});
