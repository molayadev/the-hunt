export interface HapticEnvironment {
  readonly prefersReducedMotion: boolean;
  readonly vibrate: (pattern: number) => void;
}

export function vibrateOnDecode(env: HapticEnvironment): void {
  if (env.prefersReducedMotion) return;
  env.vibrate(40);
}
