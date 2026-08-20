// shared/lib/clock.ts — ver PLAN.md §5.4. El cliente calcula localmente si
// tiene intentos disponibles; el servidor revalida siempre. Este offset solo
// evita que la UI mienta cuando el reloj del dispositivo está mal ajustado.
let offsetMs = 0; // serverNow - clientNow

export const syncClock = (serverNowIso: string): void => {
  offsetMs = Date.parse(serverNowIso) - Date.now();
};

export const now = (): number => Date.now() + offsetMs;
