import { useState } from 'react';

interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export interface TorchTrack {
  getCapabilities?: () => { torch?: boolean };
  applyConstraints: (constraints: { advanced: TorchConstraintSet[] }) => Promise<void>;
}

export interface Torch {
  readonly isOn: boolean;
  readonly isSupported: boolean;
  readonly toggle: () => void;
}

export function useTorch(track: TorchTrack | null): Torch {
  const [isOn, setIsOn] = useState(false);
  const isSupported = Boolean(track?.getCapabilities?.().torch);

  return {
    isOn,
    isSupported,
    toggle: () => {
      if (!track || !isSupported) return;
      const next = !isOn;
      track
        .applyConstraints({ advanced: [{ torch: next }] })
        .then(() => {
          setIsOn(next);
        })
        .catch(() => undefined);
    },
  };
}
