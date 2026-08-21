import { useState } from 'react';

export interface TorchTrack {
  getCapabilities?: () => { torch?: boolean };
  applyConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
}

export interface Torch {
  readonly isOn: boolean;
  readonly isSupported: boolean;
  readonly toggle: () => void;
}

export function useTorch(track: TorchTrack | null): Torch {
  const [isOn, setIsOn] = useState(false);
  return {
    isOn,
    isSupported: false,
    toggle: () => {
      setIsOn(track === null);
    },
  };
}
